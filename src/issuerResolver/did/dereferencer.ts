/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import { ParsedDID } from "did-resolver";
import { err, ok, Result } from "neverthrow";

import { BaseError } from "../../types";

import { DidDocument } from "./didDocument";
import { parseDidUri } from "./uriParser";

export enum DereferenceDidDocumentErrorType {
  MalformedDid = "MalformedDid",
  InvalidParameterError = "InvalidParameterError",
}
export type DereferenceDidDocumentError = BaseError & { type: DereferenceDidDocumentErrorType };

/**
 * Dereferences a did url in a did document
 *
 * @param didUrl - The did url to be dereferenced
 * @param didDocument - The did document containing the element to be dereferenced
 * @returns The element identified by the did url from the did document or undefined if it is not found
 */
export const dereferenceDidDocument = (
  didUrl: string,
  didDocument: DidDocument
): Result<unknown, DereferenceDidDocumentError> => {
  const parsedDid = parseDidUri(didUrl);
  if (parsedDid.isErr()) {
    return err({
      type: DereferenceDidDocumentErrorType.MalformedDid,
      message: "Failed to parse DID",
    });
  }

  const { did, fragment, path } = parsedDid.value;

  if (did !== didDocument.id) {
    return err({
      type: DereferenceDidDocumentErrorType.InvalidParameterError,
      message: "DID URL does not match DID Document ID",
    });
  }

  if (!fragment && !path) {
    return ok(didDocument);
  }

  return dereference(parsedDid.value, didDocument);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dereference = (parsedDid: ParsedDID, obj: any): Result<unknown, DereferenceDidDocumentError> => {
  if (typeof obj !== "object") {
    return ok(undefined);
  }

  const { did, fragment, path } = parsedDid;
  if (
    (obj.id && obj.id === `${did}#${fragment}`) || // did:example:123#fragment
    (obj.id && obj.id === `#${fragment}`) || // matches a relative fragment DID Url e.g. #fragment inside did:example:123 Did Doc
    (obj.id && obj.id === `${did}${path}`) || // matches an exact path DID Url e.g. did:example:123/path
    (obj.id && obj.id === `${path}`) // matches a relative path DID Url e.g. /path inside did:example:123 Did Doc
  ) {
    return ok(obj);
  }

  for (const value of Object.values(obj)) {
    const dereferenced = dereference(parsedDid, value);
    if (dereferenced.isOk() && dereferenced.value) {
      return ok(dereferenced.value);
    }
  }

  return ok(undefined);
};
