/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

// ISS CWT Claim @see https://datatracker.ietf.org/doc/html/rfc8392#section-3.1.1
export const CWT_ISS_CLAIM_TAG = 1;
// EXP CWT Claim @see https://datatracker.ietf.org/doc/html/rfc8392#section-3.1.4
export const CWT_EXP_CLAIM_TAG = 4;
// NBF CWT Claim @see https://datatracker.ietf.org/doc/html/rfc8392#section-3.1.5
export const CWT_NBF_CLAIM_TAG = 5;
// CTI CWT Claim @see https://datatracker.ietf.org/doc/html/rfc8392#section-3.1.7
export const CWT_CTI_CLAIM_TAG = 7;

// Claim Key:
// CBOR map key for the claim. Different ranges of values use
// different registration policies [RFC8126]. Integer values from
// -256 to 255 and strings of length 1 are designated as Standards
// Action. Integer values from -65536 to -257 and from 256 to 65535
// along with strings of length 2 are designated as Specification
// Required. Integer values greater than 65535 and strings of length
// greater than 2 are designated as Expert Review. Integer values
// less than -65536 are marked as Private Use.
// @see https://datatracker.ietf.org/doc/html/rfc8392#section-9.1.1
export const CWT_VC_CLAIM_TAG = "vc";

/**
 * CWT Structure Overview
 * https://datatracker.ietf.org/doc/html/rfc8392
 * - Protected Header
 *    - Key Identifier (kid, label 4)
 * - Payload
 *    - Issuer (iss, claim key 1, optional, ISO 3166-1 alpha-2 of issuer)
 *    - Expiration Time (exp, claim key 4)
 *    - Not Before (nbf, claim key 5)
 *    - CWT ID (cti, claim key 7)
 *    - Verifiable Credential (vc)
 * - Signature
 */
export interface DecodedCwtVerifiableCredential {
  readonly iss?: string;
  readonly exp?: number;
  readonly nbf?: number;
  readonly cti?: Uint8Array | Buffer;
  readonly vc?: unknown;
}

export const decodeCwtVerifiableCredential = (
  payload: Map<string | number, unknown>
): DecodedCwtVerifiableCredential => {
  const exp = payload.get(CWT_EXP_CLAIM_TAG);
  const nbf = payload.get(CWT_NBF_CLAIM_TAG);
  const iss = payload.get(CWT_ISS_CLAIM_TAG);
  const cti = payload.get(CWT_CTI_CLAIM_TAG);
  const vc = payload.get(CWT_VC_CLAIM_TAG);
  return {
    iss: typeof iss === "string" ? iss : undefined,
    exp: typeof exp === "number" ? exp : undefined,
    nbf: typeof nbf === "number" ? nbf : undefined,
    cti: cti instanceof Uint8Array ? cti : undefined, // Buffer extends Uint8Array
    vc,
  };
};
