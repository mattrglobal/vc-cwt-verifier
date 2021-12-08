/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import * as elliptic from "elliptic";
import { err, ok, Result } from "neverthrow";
import { z } from "zod";

import { decodeURLSafe, sha256Hash } from "../common/codec";
import { keyFromPublic } from "../common/elliptic";
import { BaseError, unwrap } from "../types";

type InvalidPublicEcKeypairError = BaseError & { type: "InvalidPublicEcKeypairError" };
const getPublicEcKeypair = (
  ec: elliptic.ec,
  publicKeyJwk: EcPublicKeyJwk
): Result<elliptic.ec.KeyPair, InvalidPublicEcKeypairError> => {
  try {
    const keyPair = unwrap(
      keyFromPublic({
        ec,
        x: unwrap(decodeURLSafe(publicKeyJwk.x)),
        y: unwrap(decodeURLSafe(publicKeyJwk.y)),
      })
    );
    return ok(keyPair);
  } catch (e) {
    return err({ type: "InvalidPublicEcKeypairError", message: "Failed to get valid public EC key pair" });
  }
};

export const EcPublicKeyJwkValidator = z.object({
  kty: z.literal("EC"),
  crv: z.literal("P-256"),
  x: z.string().nonempty(),
  y: z.string().nonempty(),
});
export type EcPublicKeyJwk = z.infer<typeof EcPublicKeyJwkValidator>;
type VerifyEcDsaOptions = {
  publicKeyJwk: EcPublicKeyJwk;
  signature: Uint8Array;
  data: Uint8Array;
};
/**
 * this function will be use within external verifier of cose, no need to return as neverthrow result/error
 * @param options - options for verify ecdsa signed data
 */
export const verifyEcDsa = (options: VerifyEcDsaOptions): boolean => {
  const { publicKeyJwk, signature, data } = options;

  if (signature.length !== 64) {
    return false;
  }

  const ec = new elliptic.ec("p256");
  const POINT_SIZE = 32;
  const sigOptions: elliptic.ec.SignatureOptions = {
    r: new Uint8Array(signature.slice(0, POINT_SIZE)),
    s: new Uint8Array(signature.slice(POINT_SIZE)),
  };
  const keyPairResult = getPublicEcKeypair(ec, publicKeyJwk);
  if (keyPairResult.isErr()) {
    return false;
  }
  const hashData = sha256Hash(data);
  return ec.verify(hashData, sigOptions, keyPairResult.value);
};
