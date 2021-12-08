/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import didResolver, { ParsedDID } from "did-resolver";
import { err, ok, Result } from "neverthrow";

import { BaseError } from "../../types";

export enum ParseDidUriErrorType {
  MalformedDid = "MalformedDid",
}
export type ParseDidUriError = BaseError & { type: ParseDidUriErrorType };

/**
 * Parse a did uri string to a DidUri
 */
export const parseDidUri = (uri: string): Result<ParsedDID, ParseDidUriError> => {
  const parsedDid = didResolver.parse(uri);
  if (!parsedDid) {
    return err({ type: ParseDidUriErrorType.MalformedDid, message: "Failed to parse DID" });
  }
  return ok(parsedDid);
};
