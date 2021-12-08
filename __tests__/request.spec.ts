/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import { err, ok } from "neverthrow";
import nock from "nock";

import { getRequest, RequestErrorType } from "../src/common";

describe("HTTP Request", () => {
  afterAll(async () => {
    nock.cleanAll();
  });

  it("Should return response when successful (200)", async () => {
    const response = { foo: "bar" };
    nock("https://example.com").get("/").reply(200, response);
    const result = await getRequest("https://example.com/");
    expect(result).toEqual(ok(response));
  });

  it("Should handle HTTP error (4xx)", async () => {
    nock("https://example.com").get("/").reply(400, "Bad request");
    const result = await getRequest("https://example.com/");
    expect(result).toEqual(
      err({
        cause: {
          data: "Bad request",
          status: 400,
        },
        message: "Request failed with status code 400",
        type: RequestErrorType.HttpError,
      })
    );
  });

  it("Should handle HTTP error (5xx)", async () => {
    nock("https://example.com").get("/").reply(500, "Internal server error");
    const result = await getRequest("https://example.com/");
    expect(result).toEqual(
      err({
        cause: {
          data: "Internal server error",
          status: 500,
        },
        message: "Request failed with status code 500",
        type: RequestErrorType.HttpError,
      })
    );
  });

  it("Should handle network failure", async () => {
    nock.disableNetConnect();
    const result = await getRequest("https://example.com/");
    expect(result).toEqual(
      err({
        cause: {
          code: "ERR_NOCK_NO_MATCH",
        },
        message: "Network error",
        type: RequestErrorType.NetworkError,
      })
    );
  });

  it("Should handle response timeout", async () => {
    const response = { foo: "bar" };
    const timeoutMs = 10;

    nock("https://example.com")
      .get("/")
      .delay(timeoutMs + 5)
      .reply(200, response);

    const result = await getRequest("https://example.com/", { timeoutMs: 10 });
    expect(result).toEqual(
      err({
        message: `Request timed out after ${timeoutMs}ms`,
        type: RequestErrorType.TimeoutError,
      })
    );
  });

  it("Should handle connection timeout", async () => {
    const response = { foo: "bar" };
    const timeoutMs = 10;

    nock("https://example.com")
      .get("/")
      .delayBody(timeoutMs + 5)
      .reply(200, response);

    const result = await getRequest("https://example.com/", { timeoutMs: 10 });
    expect(result).toEqual(
      err({
        message: `Request timed out after ${timeoutMs}ms`,
        type: RequestErrorType.TimeoutError,
      })
    );
  });
});
