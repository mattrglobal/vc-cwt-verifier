/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import axios from "axios";
import { Result, ResultAsync } from "neverthrow";

import { BaseError } from "../types";

export enum RequestErrorType {
  HttpError = "HttpError",
  NetworkError = "NetworkError",
  UnknownError = "UnknownError",
  TimeoutError = "TimeoutError",
}
export type RequestError = BaseError & { type: RequestErrorType };

const DEFAULT_REQUEST_TIMEOUT_MS = 10 * 1000; /* 10 seconds */
const AXIOS_TIMEOUT_ERROR = "ETIMEDOUT";

const _getRequest = async <ResponseType>(url: string, timeoutMs: number): Promise<ResponseType> => {
  /*
   * https://github.com/axios/axios/issues/647
   * Axios timeout feature only works for response timeout, not connection timeout,
   * so we need to wrap request with a cancel token timeout as well
   */
  const timeoutTokenSource = axios.CancelToken.source();
  const timeoutId = setTimeout(() => {
    timeoutTokenSource.cancel();
  }, timeoutMs);

  const { data } = await axios
    .get<ResponseType>(url, {
      timeout: timeoutMs,
      timeoutErrorMessage: "URL could not be resolved, request timed out",
      cancelToken: timeoutTokenSource?.token,
      transitional: {
        // throw ETIMEDOUT error instead of generic ECONNABORTED on request timeouts
        clarifyTimeoutError: true,
      },
    })
    .finally(() => {
      clearTimeout(timeoutId);
    });

  return data;
};

export type GetRequestOptions = {
  timeoutMs?: number;
};

const getTimeoutError = (timeoutMs: number): RequestError => {
  return {
    type: RequestErrorType.TimeoutError,
    message: `Request timed out after ${timeoutMs}ms`,
  };
};

export const getRequest = async <ResponseType>(
  url: string,
  options: GetRequestOptions = {}
): Promise<Result<ResponseType, RequestError>> => {
  const { timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS } = options;

  return ResultAsync.fromPromise(
    _getRequest(url, timeoutMs),
    (error: unknown): RequestError => {
      if (axios.isCancel(error)) {
        // Handle connection timeout
        return getTimeoutError(timeoutMs);
      }

      if (axios.isAxiosError(error)) {
        if (error.response) {
          return {
            type: RequestErrorType.HttpError,
            message: error.message,
            cause: {
              status: error.response.status,
              data: error.response.data,
            },
          };
        }

        if (error.code === AXIOS_TIMEOUT_ERROR) {
          // Handle response timeout
          return getTimeoutError(timeoutMs);
        }

        return {
          type: RequestErrorType.NetworkError,
          message: "Network error",
          cause: {
            code: error.code,
          },
        };
      }

      return {
        type: RequestErrorType.UnknownError,
        message: `Failed to GET: ${url}`,
      };
    }
  );
};
