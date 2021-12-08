/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import { Result } from "neverthrow";
import { z } from "zod";

import { Cache, CacheValidator } from "../common/cache";
import { BaseError, JsonWebKeyPublic } from "../types";

export enum IssuerResolverErrorType {
  UnableToResolveIssuer = "UnableToResolveIssuer",
  InvalidPublicKey = "InvalidPublicKey",
  NetworkError = "NetworkError",
  UnknownError = "UnknownError",
  TimeoutError = "TimeoutError",
}

export type IssuerResolverError = BaseError & { type: IssuerResolverErrorType };

/**
 * Resolve options
 */
export type ResolveOptions = {
  /**
   * Issuer identifier (eg. "did:web:organization.com")
   */
  iss: string;
  /**
   * Key identifier (eg. "CfZMD88eoh")
   */
  kid: string;
};

/**
 * Cache issuer options
 */
export type CacheIssuerOptions = {
  /**
   * Force cache refresh
   */
  force?: boolean;
};

/**
 * An instance of the issuer resolver
 */
export type IssuerResolver = {
  /**
   * Resolve issuer and cache the resolution
   *
   * @param options - options containing the issuer and key identifiers
   * @returns The issuer's public key
   */
  resolve: (options: ResolveOptions) => Promise<Result<JsonWebKeyPublic, IssuerResolverError>>;
  /**
   * Resolve the issuer and pre-populates the cache
   *
   * @param iss - the issuer identifier
   * @returns void
   */
  cacheIssuer: (iss: string, options?: CacheIssuerOptions) => Promise<Result<void, IssuerResolverError>>;
};

/**
 * Default issuer resolver options
 */
export type GetDefaultIssuerResolverOptions = {
  /**
   * Optional cache instance for issuer resolution, by default an in-memory cache will be used if it's provided
   */
  cache?: Cache;
  /**
   * Timeout (in milliseconds) for resolving the issuer
   * @default 10000 // 10 seconds
   */
  timeoutMs?: number;
};

export const GetDefaultIssuerResolverOptionsValidator = z.object({
  cache: CacheValidator.optional(),
});
