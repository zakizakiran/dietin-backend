-- DropForeignKey
ALTER TABLE `foodlogitem` DROP FOREIGN KEY `FoodLogItem_foodId_fkey`;

-- AddForeignKey
ALTER TABLE `FoodLogItem` ADD CONSTRAINT `FoodLogItem_foodId_fkey` FOREIGN KEY (`foodId`) REFERENCES `Food`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
