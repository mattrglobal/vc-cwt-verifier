/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import didResolver from "did-resolver";
import { err, ok } from "neverthrow";
import nock from "nock";

import { buildDefaultCache } from "../src/common/cache";
import {
  getDefaultIssuerResolver,
  IssuerResolver,
  IssuerResolverErrorType,
  ResolveOptions,
} from "../src/issuerResolver";
import * as didDocument from "../src/issuerResolver/did/didDocument";

import { did } from "./__fixtures__/did";
import { publicKeyJwk } from "./__fixtures__/publicKeyJwk";

describe("IssuerResolver", () => {
  let resolveOptions: ResolveOptions;
  let resolver: IssuerResolver;

  const iss = "did:web:example.com:foo";
  const kid = "key-1";

  beforeEach(async () => {
    nock("https://example.com").get("/foo/did.json").reply(200, did);

    resolveOptions = { iss, kid };
    resolver = await getDefaultIssuerResolver({});
  });

  afterAll(async () => {
    nock.cleanAll();
  });

  describe("resolve", () => {
    it("Should resolve DID and return publicKeyJwk", async () => {
      const result = await resolver.resolve(resolveOptions);
      expect(result).toEqual(ok(publicKeyJwk));
    });

    it("Should resolve DID and return publicKeyJwk from cache", async () => {
      const cache = buildDefaultCache();
      const cacheGetSpy = jest.spyOn(cache, "get");
      const cacheSetSpy = jest.spyOn(cache, "set");
      const resolveDidDocumentSpy = jest.spyOn(didDocument, "resolveDidWebDocument");

      const resolver = await getDefaultIssuerResolver({ cache });

      const result1 = await resolver.resolve(resolveOptions);
      const result2 = await resolver.resolve(resolveOptions);

      expect(result1).toEqual(ok(publicKeyJwk));
      expect(result2).toEqual(ok(publicKeyJwk));

      expect(cacheGetSpy).toHaveBeenCalledTimes(2);
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(resolveDidDocumentSpy).toHaveBeenCalledTimes(1);
    });

    it("Should not resolve DID if unable to parse didUrl", async () => {
      jest.spyOn(didResolver, "parse").mockImplementation(() => null);
      const result = await resolver.resolve(resolveOptions);
      expect(result).toEqual(
        err({ message: "Failed to parse DID", type: IssuerResolverErrorType.UnableToResolveIssuer })
      );
    });

    it("Should not resolve DID if type is not did:web", async () => {
      resolveOptions = {
        iss: "did:INVALID:xxx",
        kid: "key-1",
      };
      const result = await resolver.resolve(resolveOptions);
      expect(result).toEqual(
        err({ message: "Expected DID method to be did:web", type: IssuerResolverErrorType.UnableToResolveIssuer })
      );
    });

    it("Should throw an error if the key is not listed under the required key usage", async () => {
      nock.cleanAll();
      nock("https://example.com")
        .get("/foo/did.json")
        .reply(200, { ...did, assertionMethod: ["did:web:example.com:foo#another-key"] });
      const result = await resolver.resolve(resolveOptions);
      expect(result).toEqual(
        err({
          message: "public key not authorised as an assertionMethod in DID document",
          type: IssuerResolverErrorType.InvalidPublicKey,
        })
      );
    });

    it("Should handle failure resolving request", async () => {
      nock.cleanAll();
      nock("https://example.com").get("/foo/did.json").reply(400, "Bad request");

      const result = await resolver.resolve(resolveOptions);
      expect(result).toEqual(
        err({ message: "Request failed with status code 400", type: IssuerResolverErrorType.UnableToResolveIssuer })
      );
    });

    it("Should handle network failure", async () => {
      nock.cleanAll();
      nock.disableNetConnect();

      const result = await resolver.resolve(resolveOptions);
      expect(result).toEqual(err({ message: "Network error", type: IssuerResolverErrorType.NetworkError }));
    });
  });

  describe("cacheIssuer", () => {
    it("Should pre-cache issuer", async () => {
      const cache = buildDefaultCache();
      const cacheGetSpy = jest.spyOn(cache, "get");
      const cacheSetSpy = jest.spyOn(cache, "set");
      const resolveDidDocumentSpy = jest.spyOn(didDocument, "resolveDidWebDocument");

      const resolver = await getDefaultIssuerResolver({ cache });

      await resolver.cacheIssuer(iss);
      expect(cacheGetSpy).toHaveBeenCalledTimes(0);
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(resolveDidDocumentSpy).toHaveBeenCalledTimes(1);

      const result = await resolver.resolve(resolveOptions);
      expect(result).toEqual(ok(publicKeyJwk));

      expect(cacheGetSpy).toHaveBeenCalledTimes(1);
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(resolveDidDocumentSpy).toHaveBeenCalledTimes(1);
    });

    it("Should force refresh cache (default true)", async () => {
      nock("https://example.com").get("/foo/did.json").times(2).reply(200, did);

      const cache = buildDefaultCache();
      const cacheGetSpy = jest.spyOn(cache, "get");
      const cacheSetSpy = jest.spyOn(cache, "set");
      const resolveDidDocumentSpy = jest.spyOn(didDocument, "resolveDidWebDocument");

      const resolver = await getDefaultIssuerResolver({ cache });

      await resolver.cacheIssuer(iss);
      expect(cacheGetSpy).toHaveBeenCalledTimes(0);
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(resolveDidDocumentSpy).toHaveBeenCalledTimes(1);

      await resolver.cacheIssuer(iss);
      expect(cacheGetSpy).toHaveBeenCalledTimes(0);
      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
      expect(resolveDidDocumentSpy).toHaveBeenCalledTimes(2);
    });

    it("Should refresh cache (force = false)", async () => {
      const cache = buildDefaultCache();
      const cacheGetSpy = jest.spyOn(cache, "get");
      const cacheSetSpy = jest.spyOn(cache, "set");
      const resolveDidDocumentSpy = jest.spyOn(didDocument, "resolveDidWebDocument");

      const resolver = await getDefaultIssuerResolver({ cache });

      await resolver.cacheIssuer(iss);
      expect(cacheGetSpy).toHaveBeenCalledTimes(0);
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(resolveDidDocumentSpy).toHaveBeenCalledTimes(1);

      await resolver.cacheIssuer(iss, { force: false });
      expect(cacheGetSpy).toHaveBeenCalledTimes(1);
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(resolveDidDocumentSpy).toHaveBeenCalledTimes(1);
    });

    it("Should handle error if unable to fetch DID document", async () => {
      const iss = "did:INVALID:xxx";
      const result = await resolver.cacheIssuer(iss);
      expect(result).toEqual(
        err({ message: "Expected DID method to be did:web", type: IssuerResolverErrorType.UnableToResolveIssuer })
      );
    });
  });
});
