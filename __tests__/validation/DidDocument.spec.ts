/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import { DidDocument, DidDocumentValidator } from "../../src/issuerResolver/did";
import { did } from "../__fixtures__/did";

describe("DidDocumentValidator", () => {
  it("Should be successful with valid DID", () => {
    expect(DidDocumentValidator.safeParse(did).success).toBeTruthy();
  });
  it("Should successful with valid DID (@context as an array of strings)", () => {
    const didContextArray = {
      ...did,
      "@context": ["https://w3.org/ns/did/v1", "https://w3id.org/security/suites/jws-2020/v1"],
    };
    expect(DidDocumentValidator.safeParse(didContextArray).success).toBeTruthy();
  });

  it.each<keyof DidDocument>(["@context", "id"])("Should fail if missing required property %s", (key) => {
    const didContextArray = {
      ...did,
      [key]: undefined,
    };
    expect(DidDocumentValidator.safeParse(didContextArray).success).toBeFalsy();
  });
});
