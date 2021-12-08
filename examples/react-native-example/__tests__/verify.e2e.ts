/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import { by, device, element } from "detox";

import { getElementAttributeText } from "./testUtil";

describe("verify", () => {
  beforeEach(async () => {
    if (device.getPlatform() === "ios") {
      await device.clearKeychain();
    }
    await device.uninstallApp();
    await device.installApp();
    await device.launchApp({ newInstance: true });
  });

  it("should be able to call verify", async () => {
    await element(by.id("btnVerify")).tap();
    expect(await getElementAttributeText(element(by.id("txtResult")))).toBe(
      "Verify result: " +
        JSON.stringify({
          value: {
            verified: true,
            header: { kid: "key-1", alg: "ES256" },
            payload: {
              iss: "did:web:xxx",
              nbf: 1635459381,
              exp: 1636064181,
              vc: {
                "@context": ["https://www.w3.org/2018/credentials/v1", "https://example.com/credentials/pass"],
                type: ["VerifiableCredential", "PublicPass"],
                credentialSubject: { givenName: "Jack", familyName: "Sparrow", dob: "1979-04-14" },
              },
            },
          },
        })
    );
  });
});
