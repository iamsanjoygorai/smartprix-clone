import { describe, expect, it } from "vitest";
import { canDeleteSeedDuplicates } from "./cleanup-seed-duplicates.safety";

describe("canDeleteSeedDuplicates", () => {
  it("never deletes during dry run", () => {
    expect(canDeleteSeedDuplicates(true, true)).toBe(false);
  });

  it("does not delete without explicit confirmation", () => {
    expect(canDeleteSeedDuplicates(false, false)).toBe(false);
  });

  it("allows deletion only when both protections are disabled and confirmed", () => {
    expect(canDeleteSeedDuplicates(false, true)).toBe(true);
  });
});