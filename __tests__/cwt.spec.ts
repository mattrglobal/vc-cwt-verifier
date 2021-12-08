/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import {
  CWT_CTI_CLAIM_TAG,
  CWT_EXP_CLAIM_TAG,
  CWT_ISS_CLAIM_TAG,
  CWT_NBF_CLAIM_TAG,
  CWT_VC_CLAIM_TAG,
  decodeCwtVerifiableCredential,
  DecodedCwtVerifiableCredential,
} from "../src/cwt";

describe("CWT VC", () => {
  let validCwtVc: Map<string | number, unknown>;

  const iss = "iss";
  const nbf = new Date("2021-01-01").getTime();
  const exp = new Date("2021-01-02").getTime();
  const ctiRaw = [162, 165, 192, 103, 31, 83, 71, 59, 157, 198, 27, 130, 200, 119, 247, 93];
  const ctiUint8Array = new Uint8Array(ctiRaw);
  const ctiBuffer = Buffer.from(ctiRaw);
  const vc = {};

  beforeEach(() => {
    validCwtVc = new Map<string | number, unknown>([
      [CWT_ISS_CLAIM_TAG, iss],
      [CWT_NBF_CLAIM_TAG, nbf],
      [CWT_EXP_CLAIM_TAG, exp],
      [CWT_CTI_CLAIM_TAG, ctiUint8Array],
      [CWT_VC_CLAIM_TAG, vc],
    ]);
  });

  describe("Decode CWT VC", () => {
    it("Should decode fully formed CWT VC with Uint8Array", () => {
      const decodedCwtVc = decodeCwtVerifiableCredential(validCwtVc);
      expect(decodedCwtVc).toMatchObject({ iss, nbf, exp, cti: ctiUint8Array, vc });
    });

    it("Should decode fully formed CWT VC with Buffer", () => {
      const validCwtVcWithCtiBuffer = new Map<string | number, unknown>([
        [CWT_ISS_CLAIM_TAG, iss],
        [CWT_NBF_CLAIM_TAG, nbf],
        [CWT_EXP_CLAIM_TAG, exp],
        [CWT_CTI_CLAIM_TAG, ctiBuffer],
        [CWT_VC_CLAIM_TAG, vc],
      ]);
      const decodedCwtVc = decodeCwtVerifiableCredential(validCwtVcWithCtiBuffer);
      expect(decodedCwtVc).toMatchObject({ iss, nbf, exp, cti: ctiBuffer, vc });
    });

    const claimPropMap: ReadonlyArray<{
      claim: number | string;
      prop: keyof DecodedCwtVerifiableCredential;
    }> = [
      { claim: CWT_ISS_CLAIM_TAG, prop: "iss" },
      { claim: CWT_NBF_CLAIM_TAG, prop: "nbf" },
      { claim: CWT_EXP_CLAIM_TAG, prop: "exp" },
      { claim: CWT_CTI_CLAIM_TAG, prop: "cti" },
      { claim: CWT_VC_CLAIM_TAG, prop: "vc" },
    ];
    it.each(claimPropMap)("Should decode CWT VC with optional claims: %o", (item) => {
      const optionalClaimCwtVc = new Map(validCwtVc);
      optionalClaimCwtVc.delete(item.claim);

      const decodedCwtVc = decodeCwtVerifiableCredential(optionalClaimCwtVc);
      expect(decodedCwtVc).toMatchObject({ iss, nbf, exp, cti: ctiUint8Array, vc, [item.prop]: undefined });
    });
  });
});
