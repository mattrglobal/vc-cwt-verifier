/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import { hash } from "@stablelib/sha256";
import { mocked } from "ts-jest/utils";
import { TextEncoder } from "util";

import { verifyEcDsa } from "../../src/crypto/ecdsa";
import { validPublicKeyJwk } from "../__fixtures__/cwt";
import { ecPublicKeyBytesToJwk, generateKey, randomBytes, sign } from "../testUtil";

jest.mock("@stablelib/sha256");

describe("verifyEcDsa", () => {
  describe.each([
    "",
    "message",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc sodales purus id tortor volutpat, sit amet euismod purus aliquam. Mauris tincidunt rhoncus fermentum. Integer vulputate, leo sed lacinia aliquam, orci enim lacinia urna, quis ultrices elit risus sit amet velit. Duis egestas vestibulum sem, vel imperdiet ex luctus ut. Ut ac ex at risus convallis dictum ac sed purus. Nam convallis quam ut leo mattis vulputate non ut diam. Vestibulum odio velit, dapibus ac nibh nec, feugiat faucibus lorem. Aliquam eleifend luctus aliquam.",
  ])("sign and verify signature on a single message '%s'", (message) => {
    it.each([{ isCompactKey: true }, { isCompactKey: false }])(
      "it should pass with test options: %o",
      async ({ isCompactKey }) => {
        const keyPair = await generateKey(randomBytes, isCompactKey);
        expect(keyPair).toMatchObject({
          supportedKeyUsages: ["sign", "verify"],
          publicKey: expect.any(Uint8Array),
          secretKey: expect.any(Uint8Array),
        });

        const data = new TextEncoder().encode(message);

        const signature = await sign({ secretKey: keyPair.secretKey, message: data });
        expect(signature).toBeDefined();

        const publicKeyJwk = ecPublicKeyBytesToJwk(keyPair.publicKey);
        const verifyResult = await verifyEcDsa({
          signature,
          data,
          publicKeyJwk,
        });
        expect(verifyResult).toStrictEqual(true);
      }
    );
  });

  it.each([
    ["signature length less than 64 bytes", new Uint8Array(63)],
    ["signature length grater than 64 bytes", new Uint8Array(65)],
  ])("Should return false with %s", (desc, signature) => {
    const message = "test message";
    const data = new TextEncoder().encode(message);
    expect(
      verifyEcDsa({
        signature,
        data,
        publicKeyJwk: validPublicKeyJwk,
      })
    ).toBeFalsy();
  });

  it("should return false if decodeURLSafe public key point x throws error", () => {
    const message = "test message";
    const data = new TextEncoder().encode(message);
    const inValidPublicKeyJwk = {
      ...validPublicKeyJwk,
      x: "x",
    };
    expect(
      verifyEcDsa({
        signature: new Uint8Array(64),
        data,
        publicKeyJwk: inValidPublicKeyJwk,
      })
    ).toBeFalsy();
  });

  it("should return false if decodeURLSafe public key point y throws error", () => {
    const message = "test message";
    const data = new TextEncoder().encode(message);
    const inValidPublicKeyJwk = {
      ...validPublicKeyJwk,
      y: "y",
    };
    expect(
      verifyEcDsa({
        signature: new Uint8Array(64),
        data,
        publicKeyJwk: inValidPublicKeyJwk,
      })
    ).toBeFalsy();
  });

  it("should throw error as exception when @stablelib/sha256 hash fn throws error", () => {
    const message = "test message";
    const data = new TextEncoder().encode(message);
    const mockedSha256Hash = mocked(hash);
    mockedSha256Hash.mockImplementation(() => {
      throw new Error("SHA256: can't update because hash was finished.");
    });
    expect(() =>
      verifyEcDsa({
        signature: new Uint8Array(64),
        data,
        publicKeyJwk: validPublicKeyJwk,
      })
    ).toThrow("SHA256: can't update because hash was finished.");
  });
});
