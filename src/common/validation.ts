/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import { err, ok, Result } from "neverthrow";
import { ZodError, ZodType } from "zod";

import { ValidationError } from "../types";

const getValidationErrors = (error: ZodError): ValidationError[] =>
  error.issues.map(({ message, path }) => ({
    message,
    path,
  }));

/**
 * validate a type, return either the validated value or validation error
 */
export const validateType = <T>(value: unknown, validator: ZodType<T>): Result<T, ValidationError[]> => {
  const result = validator.safeParse(value);
  return result.success ? ok(result.data) : err(getValidationErrors(result.error));
};

/**
 * asserting a type, this will throw error exception, intended to be use for typeguard only
 */
export function assertType<T>(value: unknown, validator: ZodType<T>, name?: string): asserts value is T {
  const result = validator.safeParse(value);
  if (!result.success) {
    const errors = getValidationErrors(result.error);

    throw new TypeguardError(`Error asserting type${name ? ": " + name : ""}`, errors);
  }
}

/**
 * Error instance for typeguard
 */
export class TypeguardError extends TypeError {
  public readonly errors: ValidationError[];

  constructor(description: string, errors: ValidationError[]) {
    super(description);
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    this.errors = errors;
    Error.captureStackTrace(this);
  }
}
