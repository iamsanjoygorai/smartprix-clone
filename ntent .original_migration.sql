[33mcommit 0d8f7919e0221486a51fa3fe195419e935a5d875[m
Author: Sanjoy Gorai <iamsanjoygorai@gmail.com>
Date:   Tue Sep 15 09:31:27 2026 +0530

    admin analytics page set up

[1mdiff --git a/prisma/migrations/20260913223000_add_git_like_history/migration.sql b/prisma/migrations/20260913223000_add_git_like_history/migration.sql[m
[1mnew file mode 100644[m
[1mindex 0000000..43b9cf3[m
[1m--- /dev/null[m
[1m+++ b/prisma/migrations/20260913223000_add_git_like_history/migration.sql[m
[36m@@ -0,0 +1,128 @@[m
[32m+[m[32m-- CreateTable[m
[32m+[m[32mCREATE TABLE "HistoryEvent" ([m
[32m+[m[32m    "id" TEXT NOT NULL,[m
[32m+[m[32m    "actorUserId" TEXT,[m
[32m+[m[32m    "targetUserId" TEXT,[m
[32m+[m[32m    "category" TEXT NOT NULL,[m
[32m+[m[32m    "eventType" TEXT NOT NULL,[m
[32m+[m[32m    "operation" TEXT,[m
[32m+[m[32m    "entityType" TEXT,[m
[32m+[m[32m    "entityId" TEXT,[m
[32m+[m[32m    "title" TEXT NOT NULL,[m
[32m+[m[32m    "description" TEXT,[m
[32m+[m[32m    "version" INTEGER,[m
[32m+[m[32m    "changes" JSONB,[m
[32m+[m[32m    "metadata" JSONB,[m
[32m+[m[32m    "sessionId" TEXT,[m
[32m+[m[32m    "ipAddress" TEXT,[m
[32m+[m[32m    "userAgent" TEXT,[m
[32m+[m[32m    "country" TEXT,[m
[32m+[m[32m    "state" TEXT,[m
[32m+[m[32m    "city" TEXT,[m
[32m+[m[32m    "timezone" TEXT,[m
[32m+[m[32m    "parentEventId" TEXT,[m
[32m+[m[32m    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,[m
[32m+[m
[32m+[m[32m    CONSTRAINT "HistoryEvent_pkey" PRIMARY KEY ("id")[m
[32m+[m[32m);[m
[32m+[m
[32m+[m[32m-- CreateTable[m
[32m+[m[32mCREATE TABLE "HistorySnapshot" ([m
[32m+[m[32m    "id" TEXT NOT NULL,[m
[32m+[m[32m    "entityType" TEXT NOT NULL,[m
[32m+[m[32m    "entityId" TEXT NOT NULL,[m
[32m+[m[32m    "version" INTEGER NOT NULL,[m
[32m+[m[32m    "data" JSONB NOT NULL,[m
[32m+[m[32m    "eventId" TEXT,[m
[32m+[m[32m    "createdByUserId" TEXT,[m
[32m+[m[32m    "checksum" TEXT,[m
[32m+[m[32m    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,[m
[32m+[m
[32m+[m[32m    CONSTRAINT "HistorySnapshot_pkey" PRIMARY KEY ("id")[m
[32m+[m[32m);[m
[32m+[m
[32m+[m[32m-- CreateIndex[m
[32m+[m[32mCREATE INDEX "HistoryEvent_actorUserId_createdAt_idx"[m
[32m+[m[32mON "HistoryEvent"("actorUserId", "createdAt");[m
[32m+[m
[32m+[m[32m-- CreateIndex[m
[32m+[m[32mCREATE INDEX "HistoryEvent_targetUserId_createdAt_idx"[m
[32m+[m[32mON "HistoryEvent"("targetUserId", "createdAt");[m
[32m+[m
[32m+[m[32m-- CreateIndex[m
[32m+[m[32mCREATE INDEX "HistoryEvent_entityType_entityId_createdAt_idx"[m
[32m+[m[32mON "HistoryEvent"("entityType", "entityId", "createdAt");[m
[32m+[m
[32m+[m[32m-- CreateIndex[m
[32m+[m[32mCREATE INDEX "HistoryEvent_entityType_entityId_version_idx"[m
[32m+[m[32mON "HistoryEvent"("entityType", "entityId", "version");[m
[32m+[m
[32m+[m[32m-- CreateIndex[m
[32m+[m[32mCREATE INDEX "HistoryEvent_eventType_createdAt_idx"[m
[32m+[m[32mON "HistoryEvent"("eventType", "createdAt");[m
[32m+[m
[32m+[m[32m-- CreateIndex[m
[32m+[m[32mCREATE INDEX "HistoryEvent_category_createdAt_idx"[m
[32m+[m[32mON "HistoryEvent"("category", "createdAt");[m
[32m+[m
[32m+[m[32m-- CreateIndex[m
[32m+[m[32mCREATE INDEX "HistoryEvent_sessionId_createdAt_idx"[m
[32m+[m[32mON "HistoryEvent"("sessionId", "createdAt");[m
[32m+[m
[32m+[m[32m-- CreateIndex[m
[32m+[m[32mCREATE INDEX "HistoryEvent_parentEventId_idx"[m
[32m+[m[32mON "HistoryEvent"("parentEventId");[m
[32m+[m
[32m+[m[32m-- CreateIndex[m
[32m+[m[32mCREATE INDEX "HistoryEvent_createdAt_idx"[m
[32m+[m[32mON "HistoryEvent"("createdAt");[m
[32m+[m
[32m+[m[32m-- CreateIndex[m
[32m+[m[32mCREATE UNIQUE INDEX "HistorySnapshot_entityType_entityId_version_key"[m
[32m+[m[32mON "HistorySnapshot"("entityType", "entityId", "version");[m
[32m+[m
[32m+[m[32m-- CreateIndex[m
[32m+[m[32mCREATE INDEX "HistorySnapshot_entityType_entityId_createdAt_idx"[m
[32m+[m[32mON "HistorySnapshot"("entityType", "entityId", "createdAt");[m
[32m+[m
[32m+[m[32m-- CreateIndex[m
[32m+[m[32mCREATE INDEX "HistorySnapshot_entityType_entityId_version_idx"[m
[32m+[m[32mON "HistorySnapshot"("entityType", "entityId", "version");[m
[32m+[m
[32m+[m[32m-- CreateIndex[m
[32m+[m[32mCREATE INDEX "HistorySnapshot_createdByUserId_createdAt_idx"[m
[32m+[m[32mON "HistorySnapshot"("createdByUserId", "createdAt");[m
[32m+[m
[32m+[m[32m-- CreateIndex[m
[32m+[m[32mCREATE INDEX "HistorySnapshot_eventId_idx"[m
[32m+[m[32mON "HistorySnapshot"("eventId");[m
[32m+[m
[32m+[m[32m-- AddForeignKey[m
[32m+[m[32mALTER TABLE "HistoryEvent"[m
[32m+[m[32mADD CONSTRAINT "HistoryEvent_actorUserId_fkey"[m
[32m+[m[32mFOREIGN KEY ("actorUserId") REFERENCES "User"("id")[m
[32m+[m[32mON DELETE SET NULL ON UPDATE CASCADE;[m
[32m+[m
[32m+[m[32m-- AddForeignKey[m
[32m+[m[32mALTER TABLE "HistoryEvent"[m
[32m+[m[32mADD CONSTRAINT "HistoryEvent_targetUserId_fkey"[m
[32m+[m[32mFOREIGN KEY ("targetUserId") REFERENCES "User"("id")[m
[32m+[m[32mON DELETE SET NULL ON UPDATE CASCADE;[m
[32m+[m
[32m+[m[32m-- AddForeignKey[m
[32m+[m[32mALTER TABLE "HistoryEvent"[m
[32m+[m[32mADD CONSTRAINT "HistoryEvent_sessionId_fkey"[m
[32m+[m[32mFOREIGN KEY ("sessionId") REFERENCES "UserSession"("id")[m
[32m+[m[32mON DELETE SET NULL ON UPDATE CASCADE;[m
[32m+[m
[32m+[m[32m-- AddForeignKey[m
[32m+[m[32mALTER TABLE "HistoryEvent"[m
[32m+[m[32mADD CONSTRAINT "HistoryEvent_parentEventId_fkey"[m
[32m+[m[32mFOREIGN KEY ("parentEventId") REFERENCES "HistoryEvent"("id")[m
[32m+[m[32mON DELETE SET NULL ON UPDATE CASCADE;[m
[32m+[m
[32m+[m[32m-- AddForeignKey[m
[32m+[m[32mALTER TABLE "HistorySnapshot"[m
[32m+[m[32mADD CONSTRAINT "HistorySnapshot_createdByUserId_fkey"[m
[32m+[m[32mFOREIGN KEY ("createdByUserId") REFERENCES "User"("id")[m
[32m+[m[32mON DELETE SET NULL ON UPDATE CASCADE;[m
\ No newline at end of file[m
