-- CreateTable
CREATE TABLE "NewsCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsCategoryPost" (
    "newsId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "NewsCategoryPost_pkey" PRIMARY KEY ("newsId","categoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsCategory_name_key" ON "NewsCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "NewsCategory_slug_key" ON "NewsCategory"("slug");

-- CreateIndex
CREATE INDEX "NewsCategory_name_idx" ON "NewsCategory"("name");

-- CreateIndex
CREATE INDEX "NewsCategoryPost_categoryId_idx" ON "NewsCategoryPost"("categoryId");

-- AddForeignKey
ALTER TABLE "NewsCategoryPost" ADD CONSTRAINT "NewsCategoryPost_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsCategoryPost" ADD CONSTRAINT "NewsCategoryPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "NewsCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
