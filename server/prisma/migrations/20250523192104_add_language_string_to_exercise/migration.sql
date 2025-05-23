/*
  Warnings:

  - You are about to drop the column `languageId` on the `Exercise` table. All the data in the column will be lost.
  - Added the required column `language` to the `Exercise` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add the new language column with a temporary default
ALTER TABLE "Exercise" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'JavaScript';

-- Step 2: Update the language column with data from the ProgrammingLanguage table
UPDATE "Exercise"
SET "language" = "ProgrammingLanguage"."name"
FROM "ProgrammingLanguage"
WHERE "Exercise"."languageId" = "ProgrammingLanguage"."id";

-- Step 3: Drop the foreign key constraint and old column
ALTER TABLE "Exercise" DROP CONSTRAINT "Exercise_languageId_fkey";
ALTER TABLE "Exercise" DROP COLUMN "languageId";

-- Step 4: Remove the default constraint from the language column
ALTER TABLE "Exercise" ALTER COLUMN "language" DROP DEFAULT;
