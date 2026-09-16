import { describe, expect, it } from "vitest";

import {
  isDeletionSnapshotSafe,
  isSameIdSet,
} from "./cleanup-seed-duplicates.transaction";

describe("cleanup deletion transaction safety", () => {
  const seedDate1 = new Date("2026-09-04T16:51:39.584Z");
  const seedDate2 = new Date("2026-09-16T11:47:08.828Z");

  it("accepts the exact expected seed rows", () => {
    const expectedIds = ["price-1", "price-2"];

    const actualRows = [
      {
        id: "price-1",
        recordedAt: seedDate1,
      },
      {
        id: "price-2",
        recordedAt: seedDate2,
      },
    ];

    expect(
      isDeletionSnapshotSafe(expectedIds, actualRows),
    ).toBe(true);
  });

  it("rejects when a row is missing", () => {
    const expectedIds = ["price-1", "price-2"];

    const actualRows = [
      {
        id: "price-1",
        recordedAt: seedDate1,
      },
    ];

    expect(
      isDeletionSnapshotSafe(expectedIds, actualRows),
    ).toBe(false);
  });

  it("rejects an unexpected row", () => {
    const expectedIds = ["price-1", "price-2"];

    const actualRows = [
      {
        id: "price-1",
        recordedAt: seedDate1,
      },
      {
        id: "unexpected-price",
        recordedAt: seedDate2,
      },
    ];

    expect(
      isDeletionSnapshotSafe(expectedIds, actualRows),
    ).toBe(false);
  });

  it("rejects a row that is not a known seed timestamp", () => {
    const expectedIds = ["price-1"];

    const actualRows = [
      {
        id: "price-1",
        recordedAt: new Date("2026-09-15T12:00:00.000Z"),
      },
    ];

    expect(
      isDeletionSnapshotSafe(expectedIds, actualRows),
    ).toBe(false);
  });

  it("compares ID sets regardless of ordering", () => {
    expect(
      isSameIdSet(
        ["price-2", "price-1"],
        [
          {
            id: "price-1",
            recordedAt: seedDate1,
          },
          {
            id: "price-2",
            recordedAt: seedDate2,
          },
        ],
      ),
    ).toBe(true);
  });
});
