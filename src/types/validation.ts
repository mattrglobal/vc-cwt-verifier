/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

/**
 * Represent a single validation error
 */
export type ValidationError = {
  message: string;
  path: (string | number)[];
};
