/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import { isAfter } from "date-fns";
import { err, ok, Result } from "neverthrow";

import { CoseSignatureAlgorithmEnum, verify as coseVerify } from "@mattrglobal/cose";

import { coseDecode, coseGetKidAsString, coseGetSignatureAlgorithm } from "../common/cose";
import { assertType, validateType } from "../common/validation";
import { EcPublicKeyJwkValidator, verifyEcDsa } from "../crypto/ecdsa";
import { decodeCwtVerifiableCredential } from "../cwt";
import { getDefaultIssuerResolver, IssuerResolverErrorType } from "../issuerResolver";
import { CwtVerifiableCredentialValidator } from "../types";

import {
  VerifyError,
  VerifyErrorType,
  VerifyFailureReasonType,
  VerifyOptions,
  VerifyOptionsValidator,
  VerifyResponse,
} from "./types";

export { VerifyError, VerifyFailureReasonType, VerifyOptions, VerifyResponse, VerifyErrorType };

/**
 * verify CWT credential
 * @param options - options for verify
 */
export const verify = async (options: VerifyOptions): Promise<Result<VerifyResponse, VerifyError>> => {
  assertType(options, VerifyOptionsValidator, "VerifyOptions");
  const { payload, issuerResolver: issuerResolverOption, trustedIssuers, assertNotBefore, assertExpiry } = options;

  // cose decode
  const coseDecodeResult = await coseDecode(payload);
  if (coseDecodeResult.isErr()) {
    return ok({
      verified: false,
      reason: { type: VerifyFailureReasonType.PayloadInvalid, message: "Failed to decode cose" },
    });
  }

  const coseDecodedResult = coseDecodeResult.value;
  const decodedPayload = coseDecodedResult.payload;
  const decodedCwtVerifiableCredential = decodeCwtVerifiableCredential(decodedPayload as Map<string | number, unknown>);

  // validate cwt vc
  const cwtVerifiableCredentialValidatorResult = validateType(
    decodedCwtVerifiableCredential,
    CwtVerifiableCredentialValidator
  );
  if (cwtVerifiableCredentialValidatorResult.isErr()) {
    return ok({
      verified: false,
      reason: { type: VerifyFailureReasonType.PayloadInvalid, message: "Invalid CWT VC" },
    });
  }

  // extract kid
  const kidResult = coseGetKidAsString(coseDecodedResult);
  if (kidResult.isErr()) {
    return ok({
      verified: false,
      payload: cwtVerifiableCredentialValidatorResult.value,
      reason: { type: VerifyFailureReasonType.PayloadInvalid, message: "Failed to get kid from payload" },
    });
  }

  // extract alg
  const algResult = coseGetSignatureAlgorithm(coseDecodedResult);
  if (algResult.isErr()) {
    return ok({
      verified: false,
      payload: cwtVerifiableCredentialValidatorResult.value,
      reason: { type: VerifyFailureReasonType.PayloadInvalid, message: "Failed to get alg from payload" },
    });
  }
  if (algResult.value !== CoseSignatureAlgorithmEnum.ES256) {
    return ok({
      verified: false,
      payload: cwtVerifiableCredentialValidatorResult.value,
      reason: {
        type: VerifyFailureReasonType.UnsupportedAlgorithm,
        message: "Unsupported algorithm, expect ES256 encoded payload",
      },
    });
  }

  const header = { kid: kidResult.value, alg: CoseSignatureAlgorithmEnum[CoseSignatureAlgorithmEnum.ES256] };

  // validate iss
  if (!decodedCwtVerifiableCredential.iss) {
    return ok({
      verified: false,
      payload: cwtVerifiableCredentialValidatorResult.value,
      header,
      reason: { type: VerifyFailureReasonType.PayloadInvalid, message: "Missing iss" },
    });
  }
  if (trustedIssuers && !trustedIssuers.includes(decodedCwtVerifiableCredential.iss)) {
    return ok({
      verified: false,
      payload: cwtVerifiableCredentialValidatorResult.value,
      header,
      reason: { type: VerifyFailureReasonType.IssuerNotTrusted, message: "Issuer not trusted" },
    });
  }

  const currentDate = new Date();
  // validate nbf
  if (
    assertNotBefore &&
    decodedCwtVerifiableCredential.nbf &&
    isAfter(decodedCwtVerifiableCredential.nbf * 1000, currentDate)
  ) {
    return ok({
      verified: false,
      payload: cwtVerifiableCredentialValidatorResult.value,
      header,
      reason: {
        type: VerifyFailureReasonType.NotActive,
        message: "Credential not active, notBefore is greater than current time",
      },
    });
  }

  // validate expiry
  if (
    assertExpiry &&
    decodedCwtVerifiableCredential.exp &&
    isAfter(currentDate, decodedCwtVerifiableCredential.exp * 1000)
  ) {
    return ok({
      verified: false,
      payload: cwtVerifiableCredentialValidatorResult.value,
      header,
      reason: {
        type: VerifyFailureReasonType.Expired,
        message: "Credential is expired, current time is greater than expiry",
      },
    });
  }

  // issuer resolver
  const issuerResolver = issuerResolverOption ?? getDefaultIssuerResolver({});
  const issuerResolverResult = await issuerResolver.resolve({
    iss: decodedCwtVerifiableCredential.iss,
    kid: kidResult.value,
  });
  if (issuerResolverResult.isErr()) {
    if (issuerResolverResult.error.type === IssuerResolverErrorType.NetworkError) {
      return err({
        type: VerifyErrorType.NetworkError,
        message: "Network error occurred while resolving issuer public key",
      });
    }

    if (issuerResolverResult.error.type === IssuerResolverErrorType.TimeoutError) {
      return err({
        type: VerifyErrorType.TimeoutError,
        message: "Timeout while resolving issuer public key",
      });
    }

    if (issuerResolverResult.error.type === IssuerResolverErrorType.UnknownError) {
      return err({
        type: VerifyErrorType.UnknownError,
        message: issuerResolverResult.error.message,
      });
    }

    return ok({
      verified: false,
      payload: cwtVerifiableCredentialValidatorResult.value,
      header,
      reason: {
        type: VerifyFailureReasonType.IssuerPublicKeyInvalid,
        message: "Having problem to resolve issuer public key",
      },
    });
  }

  // validate resolved JWK from issuer
  const jsonWebKey = issuerResolverResult.value;
  const ecPublicKeyJwkValidatorResult = validateType(jsonWebKey, EcPublicKeyJwkValidator);
  if (ecPublicKeyJwkValidatorResult.isErr()) {
    return ok({
      verified: false,
      payload: cwtVerifiableCredentialValidatorResult.value,
      header,
      reason: {
        type: VerifyFailureReasonType.IssuerPublicKeyInvalid,
        message: "Invalid issuer public key, expect P-256 public key",
      },
    });
  }

  // cose verify
  const externalVerifier = (data: Uint8Array, signature: Uint8Array): Promise<boolean> => {
    const verifyResult = verifyEcDsa({ data, signature, publicKeyJwk: ecPublicKeyJwkValidatorResult.value });
    return Promise.resolve(verifyResult);
  };
  const { verified } = await coseVerify({
    payload,
    verifier: {
      externalVerifier,
    },
  });

  return verified
    ? ok({ verified: true, header, payload: cwtVerifiableCredentialValidatorResult.value })
    : ok({
        verified: false,
        header,
        payload: cwtVerifiableCredentialValidatorResult.value,
        reason: { type: VerifyFailureReasonType.SignatureInvalid, message: "Signature invalid" },
      });
};
