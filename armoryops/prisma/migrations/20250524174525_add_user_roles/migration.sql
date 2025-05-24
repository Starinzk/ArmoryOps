-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PRODUCTION', 'INVENTORY', 'QC', 'USER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';
