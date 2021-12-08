/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import { CwtVerifiableCredential } from "../../src";

export const cwtVerifiableCredentialPayload: CwtVerifiableCredential = {
  iss: "did:web:example.nz",
  nbf: 1516239022,
  exp: 1516239922,
  cti: Uint8Array.from(Buffer.from("https://example.com/credentials/abc", "utf-8")),
  vc: {
    "@context": ["https://www.w3.org/2018/credentials/v1", "https://example.com/test/v1"],
    version: "1.0.0",
    type: ["VerifiableCredential", "TestCredential"],
    credentialSubject: {
      name: "abc",
    },
  },
};
