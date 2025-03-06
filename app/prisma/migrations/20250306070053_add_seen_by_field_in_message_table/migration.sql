-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "seenBy" TEXT[] DEFAULT ARRAY[]::TEXT[];
