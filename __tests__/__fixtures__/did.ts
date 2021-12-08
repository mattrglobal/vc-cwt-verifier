/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import { publicKeyJwk } from "./publicKeyJwk";

export const did = {
  "@context": "https://w3.org/ns/did/v1",
  id: "did:web:example.com:foo",
  verificationMethod: [
    {
      id: "did:web:example.com:foo#key-1",
      controller: "did:web:example.com:foo",
      type: "JsonWebKey2020",
      publicKeyJwk,
    },
  ],
  assertionMethod: ["did:web:example.com:foo#key-1"],
};
