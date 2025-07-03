-- CreateTable
CREATE TABLE "LearningMaterial" (
    "id" TEXT NOT NULL,
    "checkpointId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "overview" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "estimatedTimeMinutes" INTEGER NOT NULL DEFAULT 5,
    "codeExamples" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearningMaterial_checkpointId_key" ON "LearningMaterial"("checkpointId");

-- AddForeignKey
ALTER TABLE "LearningMaterial" ADD CONSTRAINT "LearningMaterial_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "Checkpoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
