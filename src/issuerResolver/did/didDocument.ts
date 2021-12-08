/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import { Result, err, ok } from "neverthrow";
import { z } from "zod";

import { Cache } from "../../common/cache";
import { getRequest, RequestError } from "../../common/httpRequest";
import { validateType } from "../../common/validation";
import { EcPublicKeyJwkValidator } from "../../crypto/ecdsa";
import { BaseError } from "../../types";

export enum DidDocumentErrorType {
  InvalidDid = "InvalidDid",
  InvalidDidMethod = "InvalidDidMethod",
  InvalidDidDocument = "InvalidDidDocument",
  UnableToFetchDidDocument = "UnableToFetchDidDocument",
}
export type DidDocumentError = BaseError & { type: DidDocumentErrorType };

export const didWebPrefix = "did:web";

export const DidDocumentPublicKeyValidator = z.object({
  id: z.string(),
  controller: z.string(),
  type: z.literal("JsonWebKey2020"),
  publicKeyJwk: EcPublicKeyJwkValidator,
});

export const DidDocumentValidator = z.object({
  "@context": z.union([z.string(), z.array(z.string())]),
  id: z.string(),
  verificationMethod: z.array(DidDocumentPublicKeyValidator).optional(),
  assertionMethod: z.array(z.union([DidDocumentPublicKeyValidator, z.string()])).optional(),
});

export type DidDocument = z.infer<typeof DidDocumentValidator>;

export const createUrlFromDid = (did: string): string => {
  const domain = did.substring(`${didWebPrefix}:`.length).toLowerCase().replace(/:/g, "/");
  return domain.includes("/")
    ? `https://${decodeURIComponent(domain)}/did.json`
    : `https://${decodeURIComponent(domain)}/.well-known/did.json`;
};

export const resolveDidWebDocument = async (
  did: string,
  timeoutMs?: number
): Promise<Result<DidDocument, DidDocumentError | RequestError>> => {
  if (!did.startsWith(didWebPrefix)) {
    return err({
      type: DidDocumentErrorType.InvalidDidMethod,
      message: `Expected DID method to be ${didWebPrefix}`,
    });
  }

  const url = createUrlFromDid(did);
  const response = await getRequest(url, { timeoutMs });
  if (response.isErr()) {
    return err(response.error);
  }

  const validateDidDocument = validateType(response.value, DidDocumentValidator);
  if (validateDidDocument.isErr()) {
    return err({
      type: DidDocumentErrorType.InvalidDidDocument,
      message: "Invalid DID Document",
      cause: validateDidDocument.error,
    });
  }

  return ok(validateDidDocument.value);
};

type GetDidDocumentOptions = {
  cache: Cache;
  didUrl: string;
  timeoutMs?: number;
  force?: boolean;
};
export const getDidDocument = async (
  options: GetDidDocumentOptions
): Promise<Result<DidDocument, DidDocumentError | RequestError>> => {
  const { cache, didUrl, timeoutMs, force = false } = options;

  if (!force) {
    // Get DID Document from cache
    const cachedDidDocument = await cache.get<DidDocument>(didUrl);
    if (cachedDidDocument) {
      return ok(cachedDidDocument);
    }
  }

  // Fetch DID Document
  const resolveDidDocumentResult = await resolveDidWebDocument(didUrl, timeoutMs);
  if (resolveDidDocumentResult.isErr()) {
    return err(resolveDidDocumentResult.error);
  }
  const didDocument = resolveDidDocumentResult.value;

  // Set DID Document to cache
  await cache.set<DidDocument>(didUrl, didDocument);

  return ok(didDocument);
};
