/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import { z } from "zod";

import { assertType, TypeguardError } from "../../src/common/validation";

describe("validation", () => {
  describe("assertType", () => {
    it("should assert type", () => {
      const validator = z.object({ a: z.string(), b: z.number() });
      try {
        assertType({}, validator);
      } catch (e) {
        expect(e).toBeInstanceOf(TypeguardError);
        expect((e as TypeguardError).errors).toEqual([
          {
            message: "Required",
            path: ["a"],
          },
          {
            message: "Required",
            path: ["b"],
          },
        ]);
      }
    });
  });
});
