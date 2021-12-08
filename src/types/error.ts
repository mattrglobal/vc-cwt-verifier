/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import { Result } from "neverthrow";

export type BaseError = {
  type: string;
  message: string;
  cause?: Error | unknown;
};

/**
 * A utility function to get the value from a {@link Result} or throw if there was an error
 *
 * @remarks
 * Allows you to get the value of a result directly or handle an error {@link Result} as an exception
 *
 * @param result - The {@link Result} to unwrap
 * @typeParam T - the expected value of an ok result
 */
export const unwrap = <T = unknown>(result: Result<T, unknown>): T => {
  if (result.isErr()) {
    throw result.error;
  }
  return result.value;
};
