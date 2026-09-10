-- AlterTable
ALTER TABLE "Specification" ADD COLUMN     "column" TEXT NOT NULL DEFAULT 'LEFT',
ADD COLUMN     "groupOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Specification_group_idx" ON "Specification"("group");

-- CreateIndex
CREATE INDEX "Specification_column_idx" ON "Specification"("column");

-- CreateIndex
CREATE INDEX "Specification_groupOrder_idx" ON "Specification"("groupOrder");

-- CreateIndex
CREATE INDEX "Specification_sortOrder_idx" ON "Specification"("sortOrder");
