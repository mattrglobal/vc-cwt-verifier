/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import { err, ok, Result } from "neverthrow";

import { Cache, RequestError, RequestErrorType, validateType } from "../../common";
import { JsonWebKeyPublicValidator, JsonWebKeyPublic } from "../../types";
import { IssuerResolverError, IssuerResolverErrorType, ResolveOptions } from "../types";

import { dereferenceDidDocument } from "./dereferencer";
import { DidDocumentError, DidDocumentPublicKeyValidator, getDidDocument } from "./didDocument";

export const mapGetDidDocumentErrorToIssuerResolverError = (
  error: DidDocumentError | RequestError
): IssuerResolverError => {
  if (error.type === RequestErrorType.NetworkError) {
    return {
      type: IssuerResolverErrorType.NetworkError,
      message: error.message,
    };
  }

  if (error.type === RequestErrorType.UnknownError) {
    return {
      type: IssuerResolverErrorType.UnknownError,
      message: error.message,
    };
  }

  if (error.type === RequestErrorType.TimeoutError) {
    return {
      type: IssuerResolverErrorType.TimeoutError,
      message: error.message,
    };
  }

  return {
    type: IssuerResolverErrorType.UnableToResolveIssuer,
    message: error.message,
  };
};

export const resolve = (cache: Cache, timeoutMs?: number) => async (
  resolveOptions: ResolveOptions
): Promise<Result<JsonWebKeyPublic, IssuerResolverError>> => {
  const { iss, kid } = resolveOptions;
  const didUrl = `${iss}#${kid}`;

  // Get DID Document
  const getDidDocumentResult = await getDidDocument({ didUrl: iss, cache, timeoutMs });
  if (getDidDocumentResult.isErr()) {
    return err(mapGetDidDocumentErrorToIssuerResolverError(getDidDocumentResult.error));
  }
  const didDocument = getDidDocumentResult.value;

  // Dereference DID Document
  const dereferencedDidDocument = dereferenceDidDocument(didUrl, didDocument);
  if (dereferencedDidDocument.isErr()) {
    return err({
      type: IssuerResolverErrorType.UnableToResolveIssuer,
      message: dereferencedDidDocument.error.message,
    });
  }

  // Check if the key used to sign has the correct key usage
  const keyUsageContainsKeyId = didDocument.assertionMethod?.some((key) => {
    if (typeof key === "string") {
      return key === didUrl;
    }
    return key.id === didUrl;
  });
  if (!keyUsageContainsKeyId) {
    return err({
      type: IssuerResolverErrorType.InvalidPublicKey,
      message: `public key not authorised as an assertionMethod in DID document`,
    });
  }

  const validateDidDocumentPublicKey = validateType(dereferencedDidDocument.value, DidDocumentPublicKeyValidator);
  if (validateDidDocumentPublicKey.isErr()) {
    return err({
      type: IssuerResolverErrorType.UnableToResolveIssuer,
      message: "Invalid DID Document public key",
      cause: validateDidDocumentPublicKey.error,
    });
  }

  const didDocumentPublicKey = validateDidDocumentPublicKey.value;
  const validateJwk = validateType(didDocumentPublicKey.publicKeyJwk, JsonWebKeyPublicValidator);
  if (validateJwk.isErr()) {
    return err({
      type: IssuerResolverErrorType.InvalidPublicKey,
      message: "Invalid public key",
      cause: validateJwk.error,
    });
  }

  return ok(validateJwk.value);
};
