/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import { z, ZodType } from "zod";

export const CREDENTIAL_CONTEXT = "https://www.w3.org/2018/credentials/v1";
export const VERIFIABLE_CREDENTIAL_TYPE = "VerifiableCredential";

export type CwtVerifiableCredential = {
  /**
   * iss (Issuer) claim, see https://datatracker.ietf.org/doc/html/rfc8392#section-3.1.1
   * represents the issuer property of a verifiable credential or the holder property of a verifiable presentation.
   */
  iss: string;
  /**
   * nbf (Not Before) claim, see https://datatracker.ietf.org/doc/html/rfc8392#section-3.1.5
   * represents issuanceDate, encoded as a UNIX timestamp (NumericDate).
   */
  nbf: number;
  /**
   * exp (Expiration Time) claim, see https://datatracker.ietf.org/doc/html/rfc8392#section-3.1.4
   * represents the expirationDate property, encoded as a UNIX timestamp (NumericDate).
   */
  exp?: number;
  /**
   * cti (CWT ID) claim, see https://datatracker.ietf.org/doc/html/rfc8392#section-3.1.7
   * represents the id property of the verifiable credential
   */
  cti?: Uint8Array;
  /**
   * vc (Verifiable Credential) claim that contains the verifiable credential
   */
  vc: {
    /**
     * JSON-LD @context property
     * first item must be a uri with the value `https://www.w3.org/2018/credentials/v1`
     */
    "@context": typeof CREDENTIAL_CONTEXT | [typeof CREDENTIAL_CONTEXT, ...string[]];
    type: string | string[];
    credentialSubject: Record<string, unknown>;
    [key: string]: unknown;
  };
};

/**
 * https://www.w3.org/TR/vc-data-model/#credential-subject
 */
export const CredentialSubjectValidator = z.object({ id: z.string().optional() }).passthrough();

export const CwtVerifiableCredentialValidator = (z.object({
  iss: z.string().nonempty(),
  nbf: z.number(),
  exp: z.number().optional(),
  cit: z.instanceof(Uint8Array).optional(),
  vc: z.object({
    "@context": z
      .array(z.string())
      .refine(
        (val) => val.length > 0 && val[0] === CREDENTIAL_CONTEXT,
        () => ({ message: `first item in the array must be ${CREDENTIAL_CONTEXT}` })
      )
      .or(z.enum([CREDENTIAL_CONTEXT])),
    type: z
      .array(z.string())
      .refine(
        (val) => val.length > 0 && val.includes(VERIFIABLE_CREDENTIAL_TYPE),
        () => ({ message: `must include type ${VERIFIABLE_CREDENTIAL_TYPE}` })
      )
      .or(z.enum([VERIFIABLE_CREDENTIAL_TYPE])),
    credentialSubject: z.array(CredentialSubjectValidator).or(CredentialSubjectValidator),
  }),
}) as unknown) as ZodType<CwtVerifiableCredential>;
