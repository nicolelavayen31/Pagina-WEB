-- CreateEnum
CREATE TYPE "BudgetRange" AS ENUM ('UNDER_1K', 'FROM_1K_TO_5K', 'FROM_5K_TO_20K', 'FROM_20K_TO_50K', 'OVER_50K', 'UNKNOWN');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "budgetRange" "BudgetRange";

-- AlterTable
ALTER TABLE "ProjectImage" ADD COLUMN     "height" INTEGER NOT NULL,
ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "sizeBytes" INTEGER NOT NULL,
ADD COLUMN     "width" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Project_coverImageId_key" ON "Project"("coverImageId");

-- CreateIndex
CREATE INDEX "Project_status_publishedAt_idx" ON "Project"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectImage_storageKey_key" ON "ProjectImage"("storageKey");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "ProjectImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

