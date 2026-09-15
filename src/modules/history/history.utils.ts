import crypto from "crypto";

import type { HistoryChanges } from "./history.types";

/**
 * Fields that must NEVER be stored in history.
 *
 * This protects passwords, authentication credentials,
 * OTPs, reset tokens, cookies, JWTs, and similar secrets.
 */
const SENSITIVE_FIELDS = new Set([
  "password",
  "passwordHash",
  "currentPassword",
  "newPassword",
  "oldPassword",

  "otp",
  "otpCode",
  "verificationCode",

  "token",
  "accessToken",
  "refreshToken",
  "authToken",
  "resetToken",
  "resetPasswordToken",
  "resetPasswordTokenHash",

  "passwordResetCode",
  "passwordResetCodeHash",
  "passwordResetOtpSessionId",

  "jwt",
  "authorization",

  "cookie",
  "cookies",
  "sessionToken",
]);

function isSensitiveField(key: string): boolean {
  const normalized = key
    .replace(/[\s_-]/g, "")
    .toLowerCase();

  return Array.from(SENSITIVE_FIELDS).some(
    (field) =>
      field.replace(/[\s_-]/g, "").toLowerCase() === normalized,
  );
}

/**
 * Recursively removes sensitive fields from an object.
 */
export function sanitizeHistoryData(
  value: unknown,
): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeHistoryData(item));
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (isSensitiveField(key)) {
        continue;
      }

      result[key] = sanitizeHistoryData(nestedValue);
    }

    return result;
  }

  return value;
}

/**
 * Creates a Git-style field-level diff.
 */
export function createHistoryDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): HistoryChanges {
  const sanitizedBefore =
    sanitizeHistoryData(before) as Record<string, unknown>;

  const sanitizedAfter =
    sanitizeHistoryData(after) as Record<string, unknown>;

  const keys = new Set([
    ...Object.keys(sanitizedBefore),
    ...Object.keys(sanitizedAfter),
  ]);

  const changes: HistoryChanges = {};

  for (const key of keys) {
    const beforeValue = sanitizedBefore[key];
    const afterValue = sanitizedAfter[key];

    if (!isEqual(beforeValue, afterValue)) {
      changes[key] = {
        before: beforeValue,
        after: afterValue,
      };
    }
  }

  return changes;
}

/**
 * Deep equality helper for JSON-compatible values.
 */
function isEqual(
  a: unknown,
  b: unknown,
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Returns whether a diff contains actual changes.
 */
export function hasHistoryChanges(
  changes: HistoryChanges,
): boolean {
  return Object.keys(changes).length > 0;
}

/**
 * Generates a deterministic checksum for a snapshot.
 */
export function createHistoryChecksum(
  data: Record<string, unknown>,
): string {
  const sanitized =
    sanitizeHistoryData(data);

  const serialized = JSON.stringify(
    sortObjectKeys(sanitized),
  );

  return crypto
    .createHash("sha256")
    .update(serialized)
    .digest("hex");
}

/**
 * Recursively sorts object keys so the same data
 * produces the same checksum regardless of key order.
 */
function sortObjectKeys(
  value: unknown,
): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }

  if (
    value !== null &&
    typeof value === "object"
  ) {
    return Object.keys(
      value as Record<string, unknown>,
    )
      .sort()
      .reduce(
        (
          result,
          key,
        ) => {
          result[key] = sortObjectKeys(
            (value as Record<string, unknown>)[key],
          );

          return result;
        },
        {} as Record<string, unknown>,
      );
  }

  return value;
}