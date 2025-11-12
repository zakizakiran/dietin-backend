-- AlterTable
ALTER TABLE `user` ADD COLUMN `accessToken` VARCHAR(255) NULL,
    ADD COLUMN `refreshToken` VARCHAR(255) NULL;
