import { describe, expect, it } from "vitest";

import {
  productSpecificationUpdateSchema,
  validateSpecificationValue,
} from "./product-specification.validator";

describe("Product Specification Validator", () => {
  describe("productSpecificationUpdateSchema", () => {
    it("accepts a list of definition values", () => {
      const result = productSpecificationUpdateSchema.safeParse({
        values: [
          {
            definitionId: "def-1",
            value: "6.9",
          },
          {
            definitionId: "def-2",
            value: 12,
          },
          {
            definitionId: "def-3",
            value: true,
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it("accepts null values for optional specifications", () => {
      const result = productSpecificationUpdateSchema.safeParse({
        values: [
          {
            definitionId: "def-1",
            value: null,
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it("rejects an empty definition id", () => {
      const result = productSpecificationUpdateSchema.safeParse({
        values: [
          {
            definitionId: "",
            value: "test",
          },
        ],
      });

      expect(result.success).toBe(false);
    });

    it("rejects a missing values array", () => {
      const result = productSpecificationUpdateSchema.safeParse({});

      expect(result.success).toBe(false);
    });
  });

  describe("validateSpecificationValue", () => {
    it("accepts TEXT", () => {
      expect(
        validateSpecificationValue("TEXT", "Samsung"),
      ).toEqual({
        valid: true,
      });
    });

    it("accepts LONG_TEXT", () => {
      expect(
        validateSpecificationValue(
          "LONG_TEXT",
          "A long product description",
        ),
      ).toEqual({
        valid: true,
      });
    });

    it("accepts NUMBER", () => {
      expect(
        validateSpecificationValue("NUMBER", 12),
      ).toEqual({
        valid: true,
      });
    });

    it("accepts DECIMAL", () => {
      expect(
        validateSpecificationValue("DECIMAL", 6.9),
      ).toEqual({
        valid: true,
      });
    });

    it("accepts BOOLEAN", () => {
      expect(
        validateSpecificationValue("BOOLEAN", true),
      ).toEqual({
        valid: true,
      });
    });

    it("accepts SELECT", () => {
      expect(
        validateSpecificationValue("SELECT", "amoled"),
      ).toEqual({
        valid: true,
      });
    });

    it("accepts MULTI_SELECT", () => {
      expect(
        validateSpecificationValue(
          "MULTI_SELECT",
          ["5g", "wifi-7"],
        ),
      ).toEqual({
        valid: true,
      });
    });

    it("accepts RANGE", () => {
      expect(
        validateSpecificationValue("RANGE", {
          min: 100,
          max: 200,
        }),
      ).toEqual({
        valid: true,
      });
    });

    it("rejects a string for NUMBER", () => {
      expect(
        validateSpecificationValue("NUMBER", "12"),
      ).toEqual({
        valid: false,
        message: "Value must be a number",
      });
    });

    it("rejects a non-boolean BOOLEAN value", () => {
      expect(
        validateSpecificationValue("BOOLEAN", "true"),
      ).toEqual({
        valid: false,
        message: "Value must be a boolean",
      });
    });

    it("rejects an invalid RANGE", () => {
      expect(
        validateSpecificationValue("RANGE", {
          min: "100",
          max: 200,
        }),
      ).toEqual({
        valid: false,
        message: "Range values must be numbers",
      });
    });
  });
});