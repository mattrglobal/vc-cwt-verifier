/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import { EcPublicKeyJwk } from "../../src/crypto/ecdsa";

export const validBase64Payload =
  "0oRKogRFa2V5LTEBJqBZAQClAWtkaWQ6d2ViOnh4eAUaYXshNQQaYYRbtWJ2Y6RoQGNvbnRleHSCeCZodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MXgkaHR0cHM6Ly9leGFtcGxlLmNvbS9jcmVkZW50aWFscy9wYXNzZ3ZlcnNpb25lMS4wLjBkdHlwZYJ0VmVyaWZpYWJsZUNyZWRlbnRpYWxqUHVibGljUGFzc3FjcmVkZW50aWFsU3ViamVjdKNpZ2l2ZW5OYW1lZEphY2tqZmFtaWx5TmFtZWdTcGFycm93Y2RvYmoxOTc5LTA0LTE0B1AL5CgYIwJPMrkEDhcmjk6fWED0TYBtzx+wokSCLjLUBIeMv2ZsfXnh+gQtN14F9t064nOMk42RNqdpwXYKNOgMtxa48jAQqg4YCgJ8W6MZMoSv";

export const validPayloadCwtVcDecodedHeader = {
  alg: "ES256",
  kid: "key-1",
};

export const validPayloadCwtVcDecodedPayload = {
  exp: 1636064181,
  iss: "did:web:xxx",
  nbf: 1635459381,
  vc: {
    "@context": ["https://www.w3.org/2018/credentials/v1", "https://example.com/credentials/pass"],
    type: ["VerifiableCredential", "PublicPass"],
    credentialSubject: {
      dob: "1979-04-14",
      familyName: "Sparrow",
      givenName: "Jack",
    },
  },
};

export const validPublicKeyJwk: EcPublicKeyJwk = {
  kty: "EC",
  crv: "P-256",
  x: "7GQfPAfuiFV0f1k6EoLk0Cb0iU4EsUFb3WbS1-hwPPc",
  y: "gHqAr08-S8kqf5vFGd19ob25WmDB6lxgje7G1oZKabs",
};

export const differentPublicKeyJwk: EcPublicKeyJwk = {
  kty: "EC",
  crv: "P-256",
  x: "QRPAcOhvCaIcbeL-675iYMuwgKbvaGJwyuBfStkO7Ik",
  y: "UWj6SPcYJu5zxRGPz1Nab7cTUPrfjQfihSuEE02A20M",
};

export const unexpectedPublicKeyJwk = {
  kty: "EC",
  crv: "P-512",
  x: "QRPAcOhvCaIcbeL-675iYMuwgKbvaGJwyuBfStkO7Ik",
  y: "UWj6SPcYJu5zxRGPz1Nab7cTUPrfjQfihSuEE02A20M",
};
