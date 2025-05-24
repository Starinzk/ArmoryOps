/*
  Warnings:

  - The `currentStage` column on the `SerializedItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "AssemblyStage" AS ENUM ('LAP_AND_CLEAN', 'PIN_EJECTOR', 'INSTALL_EXTRACTOR', 'FIT_BARREL', 'TRIGGER_ASSEMBLY', 'BUILD_SLIDE', 'ASSEMBLE_LOWER', 'MATE_SLIDE_FRAME', 'FUNCTION_TEST', 'FINAL_QC', 'PACKAGE_AND_SERIALIZE');

-- CreateEnum
CREATE TYPE "UnitStageStatus" AS ENUM ('COMPLETE', 'REJECTED');

-- AlterTable
ALTER TABLE "SerializedItem" DROP COLUMN "currentStage",
ADD COLUMN     "currentStage" "AssemblyStage";

-- CreateTable
CREATE TABLE "UnitStageLog" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "stage" "AssemblyStage" NOT NULL,
    "status" "UnitStageStatus" NOT NULL,
    "notes" TEXT,
    "completedById" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnitStageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UnitStageLog_unitId_idx" ON "UnitStageLog"("unitId");

-- CreateIndex
CREATE INDEX "UnitStageLog_completedById_idx" ON "UnitStageLog"("completedById");

-- AddForeignKey
ALTER TABLE "UnitStageLog" ADD CONSTRAINT "UnitStageLog_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "SerializedItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitStageLog" ADD CONSTRAINT "UnitStageLog_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
