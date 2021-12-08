/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */
import { Result, ResultAsync } from "neverthrow";

import { decode, getKid, getHeaderParameter, CoseHeaderParameterEnum, DecodedPayloadResult } from "@mattrglobal/cose";

import { BaseError } from "../types";

export type CoseError = BaseError & { type: "CoseError" };

export const coseDecode = async (data: Uint8Array): Promise<Result<DecodedPayloadResult, CoseError>> => {
  return ResultAsync.fromPromise(
    decode(data),
    (e: unknown): CoseError => ({
      type: "CoseError",
      message: "Failed decode cose",
      cause: e,
    })
  );
};

export const coseGetKidAsString = (decodedPayload: DecodedPayloadResult): Result<string, CoseError> => {
  return Result.fromThrowable(
    () => `${getKid(decodedPayload)}`, // expect kid to be string
    (e: unknown): CoseError => ({
      type: "CoseError",
      message: "Failed get kid from cose",
      cause: e,
    })
  )();
};

export const coseGetSignatureAlgorithm = (decodedPayload: DecodedPayloadResult): Result<number, CoseError> => {
  return Result.fromThrowable(
    () => getHeaderParameter(CoseHeaderParameterEnum.alg, decodedPayload),
    (e: unknown): CoseError => ({
      type: "CoseError",
      message: "Failed get signature algorithm",
      cause: e,
    })
  )();
};
