/*
  Warnings:

  - You are about to drop the column `preferredLanguageId` on the `LearningGoal` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "LearningGoal" DROP CONSTRAINT "LearningGoal_preferredLanguageId_fkey";

-- AlterTable
ALTER TABLE "LearningGoal" DROP COLUMN "preferredLanguageId",
ADD COLUMN     "language" TEXT;
