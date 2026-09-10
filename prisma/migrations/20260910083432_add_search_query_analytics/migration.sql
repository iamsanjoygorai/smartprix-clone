-- CreateTable
CREATE TABLE "SearchQuery" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "lastSearchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchQuery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SearchQuery_count_idx" ON "SearchQuery"("count");

-- CreateIndex
CREATE INDEX "SearchQuery_lastSearchedAt_idx" ON "SearchQuery"("lastSearchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SearchQuery_normalized_key" ON "SearchQuery"("normalized");
