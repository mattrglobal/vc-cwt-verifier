/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import { validateType } from "../../src/common/validation";
import { CwtVerifiableCredentialValidator } from "../../src/types";
import { cwtVerifiableCredentialPayload } from "../__fixtures__/cwtVerifiableCredential";

describe("cwtVerifiableCredential", () => {
  it("should be able to validate valid CwtVerifiableCredential type", () => {
    const result = validateType(cwtVerifiableCredentialPayload, CwtVerifiableCredentialValidator);
    expect(result.isOk()).toBeTruthy();
  });

  it.each([
    [
      "missing context",
      {
        ...cwtVerifiableCredentialPayload,
        vc: {
          ...cwtVerifiableCredentialPayload.vc,
          "@context": ["https://example.com/test/v1"],
        },
      },
    ],
    [
      "missing type",
      {
        ...cwtVerifiableCredentialPayload,
        vc: {
          ...cwtVerifiableCredentialPayload.vc,
          type: ["TestCredential"],
        },
      },
    ],
    [
      "missing iss",
      {
        ...cwtVerifiableCredentialPayload,
        iss: undefined,
      },
    ],
    [
      "missing vc.credentialSubject with undefined",
      {
        ...cwtVerifiableCredentialPayload,
        vc: {
          ...cwtVerifiableCredentialPayload.vc,
          credentialSubject: undefined,
        },
      },
    ],
    [
      "missing vc.credentialSubject with null",
      {
        ...cwtVerifiableCredentialPayload,
        vc: {
          ...cwtVerifiableCredentialPayload.vc,
          credentialSubject: null,
        },
      },
    ],
    [
      "invalid vc.credentialSubject with non string id",
      {
        ...cwtVerifiableCredentialPayload,
        vc: {
          ...cwtVerifiableCredentialPayload.vc,
          credentialSubject: { id: 123 },
        },
      },
    ],
    [
      "invalid string vc.credentialSubject ",
      {
        ...cwtVerifiableCredentialPayload,
        vc: {
          ...cwtVerifiableCredentialPayload.vc,
          credentialSubject: "123",
        },
      },
    ],
  ])("should get err when validate invalid CwtVerifiableCredential type: %s", (_, payload) => {
    const result = validateType(payload, CwtVerifiableCredentialValidator);
    expect(result.isErr()).toBeTruthy();
  });

  it.each([
    [
      "valid vc.credentialSubject with array without id",
      {
        ...cwtVerifiableCredentialPayload,
        vc: {
          ...cwtVerifiableCredentialPayload.vc,
          credentialSubject: [{ a: 1 }],
        },
      },
    ],
    [
      "valid vc.credentialSubject with array with id",
      {
        ...cwtVerifiableCredentialPayload,
        vc: {
          ...cwtVerifiableCredentialPayload.vc,
          credentialSubject: [{ id: "123", a: 1 }],
        },
      },
    ],
    [
      "valid vc.credentialSubject with empty object",
      {
        ...cwtVerifiableCredentialPayload,
        vc: {
          ...cwtVerifiableCredentialPayload.vc,
          credentialSubject: {},
        },
      },
    ],
  ])("should be able to validate valid CwtVerifiableCredential type: %s", (_, payload) => {
    const result = validateType(payload, CwtVerifiableCredentialValidator);
    expect(result.isOk()).toBeTruthy();
  });
});
