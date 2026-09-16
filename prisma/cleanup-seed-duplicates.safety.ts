export function canDeleteSeedDuplicates(
  dryRun: boolean,
  confirmDelete: boolean,
): boolean {
  return !dryRun && confirmDelete;
}