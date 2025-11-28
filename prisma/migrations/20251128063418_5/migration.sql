/*
  Warnings:

  - A unique constraint covering the columns `[upcCode]` on the table `Food` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `food` ADD COLUMN `upcCode` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Food_upcCode_key` ON `Food`(`upcCode`);
