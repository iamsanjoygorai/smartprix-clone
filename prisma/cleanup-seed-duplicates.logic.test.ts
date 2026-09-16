import { describe, expect, it } from "vitest";

import {
  isKnownSeedTimestamp,
  selectPriceRowsForCleanup,
  type PriceCleanupRow,
} from "./cleanup-seed-duplicates.logic";

describe("selectPriceRowsForCleanup", () => {
  it("keeps only the newest row and marks older seed rows for deletion", () => {
    const rows: PriceCleanupRow[] = [
      {
        id: "oldest",
        recordedAt: new Date("2026-09-04T16:51:39.584Z"),
      },
      {
        id: "middle",
        recordedAt: new Date("2026-09-10T05:29:34.243Z"),
      },
      {
        id: "newest",
        recordedAt: new Date("2026-09-16T11:47:08.828Z"),
      },
    ];

    const result = selectPriceRowsForCleanup(rows);

    expect(result.keep?.id).toBe("newest");
    expect(result.delete.map((row) => row.id)).toEqual([
  "middle",
  "oldest",
]);
  });

  it("does nothing when there is zero or one row", () => {
    expect(selectPriceRowsForCleanup([])).toEqual({
      keep: null,
      delete: [],
    });

    const onlyRow = {
      id: "only",
      recordedAt: new Date("2026-09-16T11:47:08.828Z"),
    };

    expect(selectPriceRowsForCleanup([onlyRow])).toEqual({
      keep: onlyRow,
      delete: [],
    });
  });

  it("does not mutate the original array", () => {
    const rows: PriceCleanupRow[] = [
      {
        id: "newer",
        recordedAt: new Date("2026-09-16T11:47:08.828Z"),
      },
      {
        id: "older",
        recordedAt: new Date("2026-09-04T16:51:39.584Z"),
      },
    ];

    const originalOrder = rows.map((row) => row.id);

    selectPriceRowsForCleanup(rows);

    expect(rows.map((row) => row.id)).toEqual(originalOrder);
  });
});

describe("isKnownSeedTimestamp", () => {
  it("recognizes confirmed seed-run timestamps", () => {
    expect(
      isKnownSeedTimestamp(
        new Date("2026-09-04T16:51:39.584Z"),
      ),
    ).toBe(true);

    expect(
      isKnownSeedTimestamp(
        new Date("2026-09-16T11:47:08.828Z"),
      ),
    ).toBe(true);
  });

  it("does not classify an unrelated price observation as a seed row", () => {
    expect(
      isKnownSeedTimestamp(
        new Date("2026-09-16T12:00:00.000Z"),
      ),
    ).toBe(false);
  });
});

it("does not delete anything when there is only one confirmed seed row", () => {
  const rows: PriceCleanupRow[] = [
    {
      id: "single-seed-row",
      recordedAt: new Date("2026-09-16T11:47:08.828Z"),
    },
  ];

  const result = selectPriceRowsForCleanup(rows);

  expect(result.keep?.id).toBe("single-seed-row");
  expect(result.delete).toEqual([]);
});


it("keeps the latest row from the confirmed 16-row seed pattern", () => {
  const timestamps = [
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

  const rows: PriceCleanupRow[] = timestamps.map(
    (recordedAt, index) => ({
      id: `seed-${index + 1}`,
      recordedAt: new Date(recordedAt),
    }),
  );

  const result = selectPriceRowsForCleanup(rows);

  expect(result.keep?.id).toBe("seed-16");
  expect(result.delete).toHaveLength(15);
  expect(result.delete.map((row) => row.id)).not.toContain(
    "seed-16",
  );
});