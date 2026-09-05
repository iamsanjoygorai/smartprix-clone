-- AlterTable
ALTER TABLE "NewsCategory" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "NewsCategory_createdAt_idx" ON "NewsCategory"("createdAt");

-- CreateIndex
CREATE INDEX "NewsCategory_parentId_idx" ON "NewsCategory"("parentId");

-- AddForeignKey
ALTER TABLE "NewsCategory" ADD CONSTRAINT "NewsCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NewsCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
