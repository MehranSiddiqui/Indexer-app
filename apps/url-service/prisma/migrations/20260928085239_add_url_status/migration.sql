-- CreateEnum
CREATE TYPE "UrlStatus" AS ENUM ('Pending', 'Submitted', 'Failed', 'Indexed', 'Blocked', 'Queued');

-- AlterTable
ALTER TABLE "Url" 
ADD COLUMN     "status" "UrlStatus" NOT NULL DEFAULT 'Pending',
ADD COLUMN     "statusReason" TEXT,
ADD COLUMN     "statusUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Url"
SET
    "status" = 'Queued',
    "statusUpdatedAt" =  COALESCE("publishedAt", "updatedAt")
WHERE "publishedAt" IS NOT NULL;
