import { isKnownSeedTimestamp } from "./cleanup-seed-duplicates.logic";

export type DeletionRow = {
  id: string;
  recordedAt: Date;
};

export function isSameIdSet(
  expectedIds: string[],
  actualRows: DeletionRow[],
): boolean {
  if (expectedIds.length !== actualRows.length) {
    return false;
  }

  const expected = [...expectedIds].sort();
  const actual = actualRows.map((row) => row.id).sort();

  return expected.every(
    (id, index) => id === actual[index],
  );
}

export function isDeletionSnapshotSafe(
  expectedIds: string[],
  actualRows: DeletionRow[],
): boolean {
  if (!isSameIdSet(expectedIds, actualRows)) {
    return false;
  }

  return actualRows.every((row) =>
    isKnownSeedTimestamp(row.recordedAt),
  );
}
