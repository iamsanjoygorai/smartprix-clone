export type PriceCleanupRow = {
  id: string;
  recordedAt: Date;
};

export const KNOWN_SEED_TIMESTAMPS = [
  "2026-09-04T16:51:39.584Z",
  "2026-09-04T16:55:11.183Z",
  "2026-09-04T16:56:16.729Z",
  "2026-09-04T16:57:30.792Z",
  "2026-09-06T09:55:27.085Z",
  "2026-09-06T10:07:35.237Z",
  "2026-09-06T12:47:03.433Z",
  "2026-09-08T05:26:22.923Z",
  "2026-09-08T06:54:48.839Z",
  "2026-09-08T12:04:18.977Z",
  "2026-09-10T03:44:05.287Z",
  "2026-09-10T05:03:51.851Z",
  "2026-09-10T05:09:00.960Z",
  "2026-09-10T05:29:34.243Z",
  "2026-09-16T11:47:04.182Z",
  "2026-09-16T11:47:08.828Z",
];

export function isKnownSeedTimestamp(
  recordedAt: Date,
): boolean {
  return KNOWN_SEED_TIMESTAMPS.includes(
    recordedAt.toISOString(),
  );
}

export function selectPriceRowsForCleanup(
  rows: PriceCleanupRow[],
) {
  if (rows.length <= 1) {
    return {
      keep: rows[0] ?? null,
      delete: [],
    };
  }

  const sortedRows = [...rows].sort(
    (a, b) =>
      b.recordedAt.getTime() - a.recordedAt.getTime(),
  );

  return {
    keep: sortedRows[0],
    delete: sortedRows.slice(1),
  };
}