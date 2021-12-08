/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import { z } from "zod";

import { IssuerResolver } from "../issuerResolver";
import { BaseError, CwtVerifiableCredential } from "../types";

export type VerifyOptions = {
  /**
   * payload to verify
   */
  payload: Uint8Array;
  /**
   * specify if the verification should check the credential issuer against a list of trusted issuers. If it's not provided this check will be skipped by default
   */
  trustedIssuers?: string[];
  /**
   * specify if the verification should check the credential expiry date. if it's not provided it will check by default
   */
  assertExpiry?: boolean;
  /**
   * specify if the verification should check the credential is active with the notBefore date. if it's not provided it will check by default
   */
  assertNotBefore?: boolean;
  /**
   * optional issuer resolver, if it's provided it will use the default issuer resolver
   */
  issuerResolver?: IssuerResolver;
};

export const VerifyOptionsValidator = z.object({
  payload: z.instanceof(Uint8Array),
  trustedIssuers: z.array(z.string()).optional(),
  assertExpiry: z.boolean().optional(),
  assertNotBefore: z.boolean().optional(),
  issuerResolver: z.object({}).optional(),
});

/**
 * Verify CWT credential response
 */
export type VerifyResponse = {
  /**
   * true if the credential is verified successfully
   */
  verified: boolean;
  /**
   * decoded CWT credential payload
   */
  payload?: CwtVerifiableCredential;
  /**
   * decoded COSE header
   */
  header?: {
    /**
     * This parameter identifies one piece of data that can be used as input to find the needed cryptographic key
     * see kid under https://datatracker.ietf.org/doc/html/rfc8152#section-3.1
     */
    kid: string;
    /**
     * This parameter is used to indicate the algorithm used for the security processing
     * see alg under https://datatracker.ietf.org/doc/html/rfc8152#section-3.1
     */
    alg: string;
  };
  /**
   * reason why it's not verify
   */
  reason?: { type: VerifyFailureReasonType; message: string };
};

export enum VerifyErrorType {
  NetworkError = "NetworkError",
  TimeoutError = "TimeoutError",
  UnknownError = "UnknownError",
}
export type VerifyError = BaseError & { type: VerifyErrorType };

export enum VerifyFailureReasonType {
  /**
   * Credential payload is malformed
   */
  PayloadInvalid = "PayloadInvalid",
  /**
   * Payload cose encode with unsupported algorithm
   */
  UnsupportedAlgorithm = "UnsupportedAlgorithm",
  /**
   * Issuer of the credential is not trusted
   */
  IssuerNotTrusted = "IssuerNotTrusted",
  /**
   * Invalid issuer public key
   */
  IssuerPublicKeyInvalid = "IssuerPublicKeyInvalid",
  /**
   * The signature of the credential is invalid
   */
  SignatureInvalid = "SignatureInvalid",
  /**
   * Credential are expired
   */
  Expired = "Expired",
  /**
   * Credential are not active
   */
  NotActive = "NotActive",
}
