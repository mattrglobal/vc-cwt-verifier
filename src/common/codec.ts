/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import * as base64 from "@stablelib/base64";
import * as sha256 from "@stablelib/sha256";
import { Result } from "neverthrow";

import { BaseError } from "../types";

export const sha256Hash = (data: Uint8Array): Uint8Array => {
  return sha256.hash(data);
};

export type Base64DecodeURLSafeError = BaseError & { type: "Base64DecodeURLSafeError" };
export const decodeURLSafe = (data: string): Result<Uint8Array, Base64DecodeURLSafeError> => {
  return Result.fromThrowable(
    () => base64.decodeURLSafe(data),
    (e: unknown): Base64DecodeURLSafeError => ({
      type: "Base64DecodeURLSafeError",
      message: "Failed invoke base64.decodeURLSafe(data)",
      cause: e,
    })
  )();
};
