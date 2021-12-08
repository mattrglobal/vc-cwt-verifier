/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import { z } from "zod";

export const JsonWebKeyPublicValidator = z.object({
  kty: z.enum(["OKP", "EC"]),
  crv: z.string(),
  x: z.string().optional(),
  y: z.string().optional(),
});

export type JsonWebKeyPublic = z.infer<typeof JsonWebKeyPublicValidator>;
