/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import { buildDefaultCache } from "../common/cache";
import { assertType } from "../common/validation";

import { cacheIssuer, resolve } from "./did";
import {
  GetDefaultIssuerResolverOptions,
  GetDefaultIssuerResolverOptionsValidator,
  IssuerResolver,
  IssuerResolverErrorType,
  ResolveOptions,
  IssuerResolverError,
} from "./types";

export {
  GetDefaultIssuerResolverOptions,
  IssuerResolver,
  IssuerResolverErrorType,
  ResolveOptions,
  IssuerResolverError,
};

/**
 * Get default issuer resolver
 * @param options - options for the default issuer resolver.
 *
 * If no cache is passed in then a default one will be instantiated with `maxSize=5` and `maxMs=24hours`.
 */
export const getDefaultIssuerResolver = (options: GetDefaultIssuerResolverOptions): IssuerResolver => {
  assertType(options, GetDefaultIssuerResolverOptionsValidator, "GetDefaultIssuerResolverOptions");

  const { cache, timeoutMs } = options;
  const resolverCache = cache ? cache : buildDefaultCache();

  return {
    resolve: resolve(resolverCache, timeoutMs),
    cacheIssuer: cacheIssuer(resolverCache, timeoutMs),
  };
};
