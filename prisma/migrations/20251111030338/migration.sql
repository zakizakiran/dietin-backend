/*
  Warnings:

  - You are about to drop the column `name` on the `allergy` table. All the data in the column will be lost.
  - You are about to drop the `_userallergies` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Allergy` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Allergy` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `_userallergies` DROP FOREIGN KEY `_UserAllergies_A_fkey`;

-- DropForeignKey
ALTER TABLE `_userallergies` DROP FOREIGN KEY `_UserAllergies_B_fkey`;

-- DropIndex
DROP INDEX `Allergy_name_key` ON `allergy`;

-- AlterTable
ALTER TABLE `allergy` DROP COLUMN `name`,
    ADD COLUMN `allergy` JSON NOT NULL,
    ADD COLUMN `userId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `_userallergies`;

-- CreateIndex
CREATE UNIQUE INDEX `Allergy_userId_key` ON `Allergy`(`userId`);

-- AddForeignKey
ALTER TABLE `Allergy` ADD CONSTRAINT `Allergy_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
