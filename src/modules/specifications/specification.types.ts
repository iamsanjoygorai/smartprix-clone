export const SPECIFICATION_DATA_TYPES = [
  "TEXT",
  "LONG_TEXT",
  "NUMBER",
  "DECIMAL",
  "BOOLEAN",
  "SELECT",
  "MULTI_SELECT",
  "DATE",
  "DATETIME",
  "RANGE",
  "URL",
  "IMAGE",
  "JSON",
] as const;

export type SpecificationDataType =
  (typeof SPECIFICATION_DATA_TYPES)[number];

export function isSpecificationDataType(
  value: string,
): value is SpecificationDataType {
  return (
    SPECIFICATION_DATA_TYPES as readonly string[]
  ).includes(value);
}