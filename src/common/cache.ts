/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import LRU from "lru-cache";
import { z } from "zod";

export type Cache = {
  set: <T>(key: string, value: T) => boolean;
  get: <T>(key: string) => T | undefined;
};

export const set = (cache: LRU<string, unknown>, maxAge?: number): Cache["set"] => <T>(
  key: string,
  value: T
): boolean => {
  return cache.set(key, value, maxAge);
};

export const get = (cache: LRU<string, unknown>): Cache["get"] => <T>(key: string): T | undefined => {
  return cache.get(key) as T;
};

export const CacheValidator = z.object({
  get: z.function().args(z.string()).returns(z.promise(z.any().optional())),
  set: z.function().args(z.string(), z.any()).returns(z.promise(z.boolean())),
});

export const buildDefaultCache = (): Cache => {
  const maxSize = 5;
  const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours;
  const cache = new LRU<string, unknown>({ max: maxSize, maxAge: maxAgeMs });
  return {
    get: get(cache),
    set: set(cache, maxAgeMs),
  };
};
