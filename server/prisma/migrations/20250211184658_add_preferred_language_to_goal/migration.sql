/*
  Warnings:

  - Added the required column `preferredLanguageId` to the `LearningGoal` table without a default value. This is not possible if the table is not empty.

*/
-- Create a default programming language if it doesn't exist
INSERT INTO "ProgrammingLanguage" (id, name, "createdAt", "updatedAt")
SELECT 
  'default-lang-id',
  'JavaScript',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "ProgrammingLanguage" WHERE name = 'JavaScript'
);

-- Get the ID of the JavaScript language
DO $$ 
DECLARE
  js_lang_id TEXT;
BEGIN
  SELECT id INTO js_lang_id FROM "ProgrammingLanguage" WHERE name = 'JavaScript' LIMIT 1;

  -- Add the column as nullable first
  ALTER TABLE "LearningGoal" ADD COLUMN "preferredLanguageId" TEXT;

  -- Update existing rows with the JavaScript language ID
  UPDATE "LearningGoal" SET "preferredLanguageId" = js_lang_id WHERE "preferredLanguageId" IS NULL;

  -- Now make the column required
  ALTER TABLE "LearningGoal" ALTER COLUMN "preferredLanguageId" SET NOT NULL;

  -- Add the foreign key constraint
  ALTER TABLE "LearningGoal" ADD CONSTRAINT "LearningGoal_preferredLanguageId_fkey" 
    FOREIGN KEY ("preferredLanguageId") 
    REFERENCES "ProgrammingLanguage"("id") 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE;
END $$;
