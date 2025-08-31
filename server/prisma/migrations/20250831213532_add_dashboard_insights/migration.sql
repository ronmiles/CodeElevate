-- AlterTable
ALTER TABLE "Progress" ADD COLUMN     "reviewComments" JSONB,
ADD COLUMN     "reviewSummary" JSONB;

-- CreateTable
CREATE TABLE "DashboardInsight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "strongPoints" JSONB NOT NULL,
    "skillsToStrengthen" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DashboardInsight_userId_key" ON "DashboardInsight"("userId");

-- AddForeignKey
ALTER TABLE "DashboardInsight" ADD CONSTRAINT "DashboardInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
