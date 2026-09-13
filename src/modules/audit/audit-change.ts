export interface AuditChange {
  field: string;
  label: string;
  before: unknown;
  after: unknown;
}

interface AuditField {
  key: string;
  label: string;
}

/**
 * Creates a list of only the fields that actually changed.
 *
 * Example:
 * name: "Sanjoy" -> "Sanjoy Kumar"
 *
 * becomes:
 * {
 *   field: "name",
 *   label: "Name",
 *   before: "Sanjoy",
 *   after: "Sanjoy Kumar"
 * }
 */
export function buildAuditChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: AuditField[],
): AuditChange[] {
  const changes: AuditChange[] = [];

  for (const field of fields) {
    const beforeValue = normalizeAuditValue(
      before[field.key],
    );

    const afterValue = normalizeAuditValue(
      after[field.key],
    );

    if (!areAuditValuesEqual(beforeValue, afterValue)) {
      changes.push({
        field: field.key,
        label: field.label,
        before: beforeValue,
        after: afterValue,
      });
    }
  }

  return changes;
}

/**
 * Normalizes values so dates, nulls and undefined
 * are handled consistently.
 */
function normalizeAuditValue(
  value: unknown,
): unknown {
  if (value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

/**
 * Safely compares audit values.
 */
function areAuditValuesEqual(
  before: unknown,
  after: unknown,
): boolean {
  return JSON.stringify(before) === JSON.stringify(after);
}