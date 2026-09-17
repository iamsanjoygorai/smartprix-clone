import { z } from "zod";

/* =========================================================
   Types
========================================================= */

export type SpecificationDataType =
  | "TEXT"
  | "LONG_TEXT"
  | "NUMBER"
  | "DECIMAL"
  | "BOOLEAN"
  | "SELECT"
  | "MULTI_SELECT"
  | "DATE"
  | "DATETIME"
  | "RANGE"
  | "URL"
  | "IMAGE"
  | "JSON";

export interface SpecificationValidationResult {
  valid: boolean;
  message?: string;
}

/* =========================================================
   Update Payload Schema
========================================================= */

const productSpecificationValueSchema = z.object({
  definitionId: z
    .string()
    .trim()
    .min(1, "Definition ID is required"),

  value: z.unknown().nullable(),
});

export const productSpecificationUpdateSchema = z.object({
  values: z.array(productSpecificationValueSchema),
});

export type ProductSpecificationUpdateInput = z.infer<
  typeof productSpecificationUpdateSchema
>;

/* =========================================================
   Typed Value Validation
========================================================= */

export function validateSpecificationValue(
  dataType: SpecificationDataType | string,
  value: unknown,
): SpecificationValidationResult {
  /*
   * Null is allowed at this layer because optional
   * specifications may intentionally be cleared.
   *
   * Required-field validation belongs to the schema-aware
   * service because only the service knows whether a
   * definition is required.
   */
  if (value === null || value === undefined) {
    return {
      valid: true,
    };
  }

  switch (dataType) {
    case "TEXT":
      if (typeof value !== "string") {
        return {
          valid: false,
          message: "Value must be a string",
        };
      }

      return {
        valid: true,
      };

    case "LONG_TEXT":
      if (typeof value !== "string") {
        return {
          valid: false,
          message: "Value must be a string",
        };
      }

      return {
        valid: true,
      };

    case "NUMBER":
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return {
          valid: false,
          message: "Value must be a number",
        };
      }

      if (!Number.isInteger(value)) {
        return {
          valid: false,
          message: "Value must be an integer",
        };
      }

      return {
        valid: true,
      };

    case "DECIMAL":
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return {
          valid: false,
          message: "Value must be a number",
        };
      }

      return {
        valid: true,
      };

    case "BOOLEAN":
      if (typeof value !== "boolean") {
        return {
          valid: false,
          message: "Value must be a boolean",
        };
      }

      return {
        valid: true,
      };

    case "SELECT":
      if (typeof value !== "string" || value.trim().length === 0) {
        return {
          valid: false,
          message: "Value must be a non-empty string",
        };
      }

      return {
        valid: true,
      };

    case "MULTI_SELECT":
      if (
        !Array.isArray(value) ||
        value.length === 0 ||
        value.some(
          (item) => typeof item !== "string" || item.trim().length === 0,
        )
      ) {
        return {
          valid: false,
          message: "Value must be a non-empty array of strings",
        };
      }

      return {
        valid: true,
      };

    case "RANGE":
      if (!isValidRange(value)) {
        return {
          valid: false,
          message: "Range values must be numbers",
        };
      }

      if (value.min > value.max) {
        return {
          valid: false,
          message: "Range minimum cannot be greater than maximum",
        };
      }

      return {
        valid: true,
      };

    case "DATE":
    case "DATETIME":
      if (!isValidDateValue(value)) {
        return {
          valid: false,
          message: "Value must be a valid date",
        };
      }

      return {
        valid: true,
      };

    case "URL":
      if (typeof value !== "string") {
        return {
          valid: false,
          message: "Value must be a valid URL",
        };
      }

      try {
        new URL(value);

        return {
          valid: true,
        };
      } catch {
        return {
          valid: false,
          message: "Value must be a valid URL",
        };
      }

    case "IMAGE":
      if (typeof value !== "string" || value.trim().length === 0) {
        return {
          valid: false,
          message: "Value must be an image URL",
        };
      }

      return {
        valid: true,
      };

    case "JSON":
      try {
        JSON.stringify(value);

        return {
          valid: true,
        };
      } catch {
        return {
          valid: false,
          message: "Value must be valid JSON",
        };
      }

    default:
      return {
        valid: false,
        message: `Unsupported specification data type: ${dataType}`,
      };
  }
}

/* =========================================================
   Helpers
========================================================= */

function isValidRange(
  value: unknown,
): value is {
  min: number;
  max: number;
} {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const range = value as Record<string, unknown>;

  return (
    typeof range.min === "number" &&
    Number.isFinite(range.min) &&
    typeof range.max === "number" &&
    Number.isFinite(range.max)
  );
}

function isValidDateValue(value: unknown): boolean {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  if (typeof value !== "string") {
    return false;
  }

  const timestamp = Date.parse(value);

  return !Number.isNaN(timestamp);
}