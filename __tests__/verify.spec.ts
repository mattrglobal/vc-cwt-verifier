/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */
import * as base64 from "@stablelib/base64";
import { isAfter, isBefore } from "date-fns";
import * as MockDate from "mockdate";
import { err, ok } from "neverthrow";
import { mocked } from "ts-jest/utils";

import { verify, VerifyOptions } from "../src";
import { EcPublicKeyJwk } from "../src/crypto/ecdsa";
import { getDefaultIssuerResolver, IssuerResolverErrorType } from "../src/issuerResolver";
import { VerifyErrorType, VerifyFailureReasonType } from "../src/verify";

import {
  differentPublicKeyJwk,
  unexpectedPublicKeyJwk,
  validBase64Payload,
  validPayloadCwtVcDecodedHeader,
  validPayloadCwtVcDecodedPayload,
  validPublicKeyJwk,
} from "./__fixtures__/cwt";
import { genMockErrorIssuerResolver, genMockIssuerResolver } from "./testUtil";

jest.mock("../src/issuerResolver", () => {
  return {
    ...jest.requireActual("../src/issuerResolver"),
    getDefaultIssuerResolver: jest.fn(jest.requireActual("../src/issuerResolver").getDefaultIssuerResolver),
  };
});

describe("verify", () => {
  afterEach(() => {
    MockDate.reset();
  });

  it("should guard the type in runtime", async () => {
    const options = ({
      payload: {},
      trustedIssuers: 1,
    } as unknown) as VerifyOptions;

    await expect(verify(options)).rejects.toHaveProperty("errors", [
      {
        message: "Input not instance of Uint8Array",
        path: ["payload"],
      },
      {
        message: "Expected array, received number",
        path: ["trustedIssuers"],
      },
    ]);
  });

  it("should be able to verify with default issuer resolver", async () => {
    const mockedGetDefaultIssuerResolver = mocked(getDefaultIssuerResolver);
    mockedGetDefaultIssuerResolver.mockReturnValue(genMockIssuerResolver(validPublicKeyJwk));
    await expect(verify({ payload: base64.decode(validBase64Payload) })).resolves.toStrictEqual(
      ok({
        verified: true,
        header: validPayloadCwtVcDecodedHeader,
        payload: validPayloadCwtVcDecodedPayload,
      })
    );
  });

  it("should be able to verify with issuer resolver option", async () => {
    await expect(
      verify({
        payload: base64.decode(validBase64Payload),
        issuerResolver: await genMockIssuerResolver(validPublicKeyJwk),
      })
    ).resolves.toStrictEqual(
      ok({
        verified: true,
        header: validPayloadCwtVcDecodedHeader,
        payload: validPayloadCwtVcDecodedPayload,
      })
    );
  });

  it("should fail to verify with issuer resolve unexpectedPublicKeyJwk", async () => {
    await expect(
      verify({
        payload: base64.decode(validBase64Payload),
        issuerResolver: await genMockIssuerResolver(unexpectedPublicKeyJwk as EcPublicKeyJwk),
      })
    ).resolves.toStrictEqual(
      ok({
        verified: false,
        header: validPayloadCwtVcDecodedHeader,
        payload: validPayloadCwtVcDecodedPayload,
        reason: {
          message: "Invalid issuer public key, expect P-256 public key",
          type: VerifyFailureReasonType.IssuerPublicKeyInvalid,
        },
      })
    );
  });

  it("should fail for invalid public key error", async () => {
    await expect(
      verify({
        payload: base64.decode(validBase64Payload),
        issuerResolver: await genMockErrorIssuerResolver(),
      })
    ).resolves.toStrictEqual(
      ok({
        verified: false,
        payload: validPayloadCwtVcDecodedPayload,
        header: { kid: "key-1", alg: "ES256" },
        reason: {
          message: "Having problem to resolve issuer public key",
          type: VerifyFailureReasonType.IssuerPublicKeyInvalid,
        },
      })
    );
  });

  it.each<[IssuerResolverErrorType, VerifyErrorType, string]>([
    [
      IssuerResolverErrorType.NetworkError,
      VerifyErrorType.NetworkError,
      "Network error occurred while resolving issuer public key",
    ],
    [IssuerResolverErrorType.TimeoutError, VerifyErrorType.TimeoutError, "Timeout while resolving issuer public key"],
  ])(
    "should return err when issuer resolver has %s error",
    async (issuerResolverError, verifyErrorType, verifyErrorMessage) => {
      await expect(
        verify({
          payload: base64.decode(validBase64Payload),
          issuerResolver: await genMockErrorIssuerResolver(issuerResolverError),
        })
      ).resolves.toStrictEqual(
        err({
          type: verifyErrorType,
          message: verifyErrorMessage,
        })
      );
    }
  );

  it("should fail to verify with different public key JWK in issuer resolver option", async () => {
    await expect(
      verify({
        payload: base64.decode(validBase64Payload),
        issuerResolver: await genMockIssuerResolver(differentPublicKeyJwk),
      })
    ).resolves.toStrictEqual(
      ok({
        verified: false,
        header: validPayloadCwtVcDecodedHeader,
        payload: validPayloadCwtVcDecodedPayload,
        reason: {
          message: "Signature invalid",
          type: VerifyFailureReasonType.SignatureInvalid,
        },
      })
    );
  });

  it("should fail to verify when iss not trusted", async () => {
    await expect(
      verify({
        payload: base64.decode(validBase64Payload),
        issuerResolver: await genMockIssuerResolver(validPublicKeyJwk),
        trustedIssuers: [],
      })
    ).resolves.toStrictEqual(
      ok({
        verified: false,
        payload: validPayloadCwtVcDecodedPayload,
        header: { kid: "key-1", alg: "ES256" },
        reason: {
          message: "Issuer not trusted",
          type: VerifyFailureReasonType.IssuerNotTrusted,
        },
      })
    );
  });

  it("should fail to verify when failed to decode cose", async () => {
    await expect(
      verify({
        payload: new Uint8Array(0),
        issuerResolver: await genMockIssuerResolver(validPublicKeyJwk),
      })
    ).resolves.toStrictEqual(
      ok({
        verified: false,
        reason: {
          message: "Failed to decode cose",
          type: VerifyFailureReasonType.PayloadInvalid,
        },
      })
    );
  });

  it("should fail to verify with assertNotBefore", async () => {
    const nbfInMs = validPayloadCwtVcDecodedPayload.nbf * 1000;
    const validaDate = new Date(nbfInMs + 1);
    expect(isAfter(validaDate, new Date(2021, 1, 1))).toBeTruthy();
    expect(isBefore(validaDate, new Date(2030, 1, 1))).toBeTruthy();
    MockDate.set(validaDate);
    await expect(
      verify({
        payload: base64.decode(validBase64Payload),
        issuerResolver: await genMockIssuerResolver(validPublicKeyJwk),
        assertNotBefore: true,
      })
    ).resolves.toStrictEqual(
      ok({
        verified: true,
        header: validPayloadCwtVcDecodedHeader,
        payload: validPayloadCwtVcDecodedPayload,
      })
    );

    const notActiveDate = new Date(nbfInMs - 1);
    expect(isAfter(notActiveDate, new Date(2021, 1, 1))).toBeTruthy();
    expect(isBefore(notActiveDate, new Date(2030, 1, 1))).toBeTruthy();
    MockDate.set(notActiveDate);
    await expect(
      verify({
        payload: base64.decode(validBase64Payload),
        issuerResolver: await genMockIssuerResolver(validPublicKeyJwk),
        assertNotBefore: true,
      })
    ).resolves.toStrictEqual(
      ok({
        verified: false,
        payload: validPayloadCwtVcDecodedPayload,
        header: { kid: "key-1", alg: "ES256" },
        reason: {
          message: "Credential not active, notBefore is greater than current time",
          type: VerifyFailureReasonType.NotActive,
        },
      })
    );
  });

  it("should fail to verify with assertExpiry", async () => {
    const expInMs = validPayloadCwtVcDecodedPayload.exp * 1000;
    const validDate = new Date(expInMs - 1);
    expect(isAfter(validDate, new Date(2021, 1, 1))).toBeTruthy();
    expect(isBefore(validDate, new Date(2030, 1, 1))).toBeTruthy();
    MockDate.set(validDate);
    await expect(
      verify({
        payload: base64.decode(validBase64Payload),
        issuerResolver: await genMockIssuerResolver(validPublicKeyJwk),
        assertExpiry: true,
      })
    ).resolves.toStrictEqual(
      ok({
        verified: true,
        header: validPayloadCwtVcDecodedHeader,
        payload: validPayloadCwtVcDecodedPayload,
      })
    );

    const expiredDate = new Date(expInMs + 1);
    expect(isAfter(expiredDate, new Date(2021, 1, 1))).toBeTruthy();
    expect(isBefore(expiredDate, new Date(2030, 1, 1))).toBeTruthy();
    MockDate.set(expiredDate);
    await expect(
      verify({
        payload: base64.decode(validBase64Payload),
        issuerResolver: await genMockIssuerResolver(validPublicKeyJwk),
        assertExpiry: true,
      })
    ).resolves.toStrictEqual(
      ok({
        verified: false,
        payload: validPayloadCwtVcDecodedPayload,
        header: { kid: "key-1", alg: "ES256" },
        reason: {
          message: "Credential is expired, current time is greater than expiry",
          type: VerifyFailureReasonType.Expired,
        },
      })
    );
  });
});
