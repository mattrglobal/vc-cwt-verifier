/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import * as base64 from "@stablelib/base64";
import * as hex from "@stablelib/hex";
import * as random from "@stablelib/random";
import * as sha256 from "@stablelib/sha256";
import * as elliptic from "elliptic";
import { err, ok, Result } from "neverthrow";

import { EcPublicKeyJwk } from "../src/crypto/ecdsa";
import { IssuerResolver, IssuerResolverError, IssuerResolverErrorType } from "../src/issuerResolver/types";

export const randomBytes = async (length: number): Promise<Uint8Array> => {
  return random.randomBytes(length);
};

export type GenerateRandomFunction = (length: number) => Promise<Uint8Array>;
export const generateKey = async (
  generateRandom: GenerateRandomFunction,
  isCompactKey: boolean
): Promise<{
  secretKey: Uint8Array;
  publicKey: Uint8Array;
  supportedKeyUsages: KeyUsage[];
}> => {
  const ec = new elliptic.ec("p256");
  const keyPair = ec.genKeyPair({
    entropy: hex.encode(await generateRandom(64)),
  });
  const publicKey = hex.decode(keyPair.getPublic().encode("hex", isCompactKey));
  // BN.js toArray() implementation not use fix size array, force it to be 32 length.
  const secretKey = new Uint8Array(keyPair.getPrivate().toArray("be", 32));
  return { secretKey, publicKey, supportedKeyUsages: ["sign", "verify"] };
};

export type SignOptions = {
  secretKey: Uint8Array;
  message: Uint8Array;
};
export const sign = async ({ secretKey, message }: SignOptions): Promise<Uint8Array> => {
  const ec = new elliptic.ec("p256");
  const keyPair = ec.keyFromPrivate(secretKey);
  const sig = ec.sign(sha256.hash(message), keyPair, { canonical: true });
  return Uint8Array.from([...sig.r.toArray("be", 32), ...sig.s.toArray("be", 32)]);
};

export const base64UrlEncodeNoPadding = (data: Uint8Array): string => {
  const urlSafeWithPadding = base64.encodeURLSafe(data);
  // removes urlSafe padding
  return urlSafeWithPadding.split("=")[0];
};
export const ecPublicKeyBytesToJwk = (publicKey: Uint8Array): EcPublicKeyJwk => {
  const ec = new elliptic.ec("p256");
  const keyPair = ec.keyFromPublic(publicKey).getPublic();
  // ensure zero pad to a fixed length, sometime this return 31 length array here
  const xValue = new Uint8Array(keyPair.getX().toArray("be", 32));
  const yValue = new Uint8Array(keyPair.getY().toArray("be", 32));
  return {
    kty: "EC",
    crv: "P-256",
    x: base64UrlEncodeNoPadding(xValue),
    y: base64UrlEncodeNoPadding(yValue),
  };
};

export const genMockIssuerResolver = (mockPublicKeyJwk: EcPublicKeyJwk): IssuerResolver => {
  const resolve = (): Promise<Result<EcPublicKeyJwk, IssuerResolverError>> => Promise.resolve(ok(mockPublicKeyJwk));
  const cacheIssuer = (): Promise<Result<void, IssuerResolverError>> => Promise.resolve(ok(undefined));

  return {
    resolve,
    cacheIssuer,
  };
};

export const genMockErrorIssuerResolver = async (
  type = IssuerResolverErrorType.InvalidPublicKey,
  message = "Issuer resolver error"
): Promise<IssuerResolver> => {
  const resolve = (): Promise<Result<EcPublicKeyJwk, IssuerResolverError>> => Promise.resolve(err({ type, message }));
  const cacheIssuer = (): Promise<Result<void, IssuerResolverError>> => Promise.resolve(ok(undefined));

  return {
    resolve,
    cacheIssuer,
  };
};
