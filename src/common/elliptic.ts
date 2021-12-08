/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import * as elliptic from "elliptic";
import { Result } from "neverthrow";

import { BaseError } from "../types";

export type EllipticKeyFromPublicError = BaseError & { type: "EllipticKeyFromPublicError" };

type KeyFromPublicOptions = {
  ec: elliptic.ec;
  x: Uint8Array;
  y: Uint8Array;
};
export const keyFromPublic = ({
  ec,
  x,
  y,
}: KeyFromPublicOptions): Result<elliptic.ec.KeyPair, EllipticKeyFromPublicError> => {
  return Result.fromThrowable(
    // elliptic actually support buffer for x and y
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    () => ec.keyFromPublic({ x, y }),
    (e: unknown): EllipticKeyFromPublicError => ({
      type: "EllipticKeyFromPublicError",
      message: "Failed invoke elliptic.keyFromPublic({x, y})",
      cause: e,
    })
  )();
};
