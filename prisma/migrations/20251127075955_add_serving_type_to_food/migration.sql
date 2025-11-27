/*
  Warnings:

  - You are about to drop the column `foodLogItemsId` on the `food` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `food` DROP COLUMN `foodLogItemsId`,
    ADD COLUMN `servingType` VARCHAR(191) NULL DEFAULT 'porsi';
