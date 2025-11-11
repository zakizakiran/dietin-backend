-- AlterTable
ALTER TABLE `user` ADD COLUMN `activityLevel` VARCHAR(191) NULL,
    ADD COLUMN `birthDate` DATETIME(3) NULL,
    ADD COLUMN `gender` ENUM('Male', 'Female') NULL,
    ADD COLUMN `height` DOUBLE NULL,
    ADD COLUMN `mainGoal` VARCHAR(191) NULL,
    ADD COLUMN `weight` DOUBLE NULL,
    ADD COLUMN `weightGoal` DOUBLE NULL;

-- CreateTable
CREATE TABLE `Allergy` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Allergy_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_UserAllergies` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_UserAllergies_AB_unique`(`A`, `B`),
    INDEX `_UserAllergies_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_UserAllergies` ADD CONSTRAINT `_UserAllergies_A_fkey` FOREIGN KEY (`A`) REFERENCES `Allergy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_UserAllergies` ADD CONSTRAINT `_UserAllergies_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
