/*
  Warnings:

  - Added the required column `productModel` to the `Batch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `Batch` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Batch" ADD COLUMN     "productModel" TEXT NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL;
