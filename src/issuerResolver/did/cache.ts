/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import { err, ok, Result } from "neverthrow";

import { Cache } from "../../common/cache";
import { CacheIssuerOptions, IssuerResolverError, IssuerResolverErrorType } from "../types";

import { didWebPrefix, getDidDocument } from "./didDocument";
import { mapGetDidDocumentErrorToIssuerResolverError } from "./resolver";

export const cacheIssuer = (cache: Cache, timeoutMs?: number) => async (
  iss: string,
  options: CacheIssuerOptions = {}
): Promise<Result<void, IssuerResolverError>> => {
  const { force = true } = options;

  if (!iss.startsWith(didWebPrefix)) {
    return err({
      type: IssuerResolverErrorType.UnableToResolveIssuer,
      message: `Expected DID method to be ${didWebPrefix}`,
    });
  }

  const getDidDocumentResult = await getDidDocument({ cache, didUrl: iss, force, timeoutMs });
  if (getDidDocumentResult.isErr()) {
    return err(mapGetDidDocumentErrorToIssuerResolverError(getDidDocumentResult.error));
  }
  return ok(undefined);
};
