-- AlterTable
ALTER TABLE `Product` ADD COLUMN `brand` VARCHAR(191) NULL,
    ADD COLUMN `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isNewArrival` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lowStockThreshold` INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN `metaDescription` VARCHAR(300) NULL,
    ADD COLUMN `metaTitle` VARCHAR(191) NULL,
    ADD COLUMN `salePrice` DECIMAL(10, 2) NULL,
    ADD COLUMN `shortDescription` VARCHAR(500) NULL,
    ADD COLUMN `sku` VARCHAR(191) NULL,
    ADD COLUMN `slug` VARCHAR(191) NULL,
    ADD COLUMN `specifications` JSON NULL,
    ADD COLUMN `status` ENUM('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DRAFT') NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `tags` VARCHAR(500) NULL,
    ADD COLUMN `viewCount` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Category` ADD COLUMN `imageUrl` VARCHAR(1000) NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `metaDescription` VARCHAR(300) NULL,
    ADD COLUMN `metaTitle` VARCHAR(191) NULL,
    ADD COLUMN `slug` VARCHAR(191) NULL,
    ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Subcategory` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `slug` VARCHAR(191) NULL,
    ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `ProductImage` ADD COLUMN `altText` VARCHAR(191) NULL,
    ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0,
    MODIFY `url` VARCHAR(1000) NOT NULL;

-- AlterTable
ALTER TABLE `Admin` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `lastLoginAt` DATETIME(3) NULL;


-- Backfill slugs for rows that existed before this migration
UPDATE `Product` SET `slug` = CONCAT(TRIM(BOTH '-' FROM LOWER(REGEXP_REPLACE(`name`, '[^A-Za-z0-9]+', '-'))), '-', `id`) WHERE `slug` IS NULL;
UPDATE `Category` SET `slug` = TRIM(BOTH '-' FROM LOWER(REGEXP_REPLACE(`name`, '[^A-Za-z0-9]+', '-'))) WHERE `slug` IS NULL;
UPDATE `Subcategory` SET `slug` = TRIM(BOTH '-' FROM LOWER(REGEXP_REPLACE(`name`, '[^A-Za-z0-9]+', '-'))) WHERE `slug` IS NULL;

ALTER TABLE `Product` MODIFY `slug` VARCHAR(191) NOT NULL;
ALTER TABLE `Category` MODIFY `slug` VARCHAR(191) NOT NULL;
ALTER TABLE `Subcategory` MODIFY `slug` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `Customer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Customer_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Inquiry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `inquiryNumber` VARCHAR(191) NOT NULL,
    `customerId` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `address` TEXT NOT NULL,
    `city` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `channel` ENUM('WHATSAPP', 'EMAIL', 'WEB') NOT NULL DEFAULT 'WHATSAPP',
    `status` ENUM('NEW', 'CONTACTED', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'NEW',
    `itemCount` INTEGER NOT NULL,
    `estimatedTotal` DECIMAL(10, 2) NOT NULL,
    `adminNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Inquiry_inquiryNumber_key`(`inquiryNumber`),
    INDEX `Inquiry_status_idx`(`status`),
    INDEX `Inquiry_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InquiryItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `inquiryId` INTEGER NOT NULL,
    `productId` INTEGER NULL,
    `productName` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NULL,
    `unitPrice` DECIMAL(10, 2) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `lineTotal` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InquiryStatusHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `inquiryId` INTEGER NOT NULL,
    `status` ENUM('NEW', 'CONTACTED', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED') NOT NULL,
    `note` VARCHAR(500) NULL,
    `adminId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Banner` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `subtitle` VARCHAR(500) NULL,
    `imageUrl` VARCHAR(1000) NOT NULL,
    `buttonText` VARCHAR(191) NULL,
    `buttonLink` VARCHAR(500) NULL,
    `placement` ENUM('HERO', 'PROMO') NOT NULL DEFAULT 'HERO',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Setting` (
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Page` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `metaTitle` VARCHAR(191) NULL,
    `metaDescription` VARCHAR(300) NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Page_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_RelatedProducts` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_RelatedProducts_AB_unique`(`A`, `B`),
    INDEX `_RelatedProducts_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Product_slug_key` ON `Product`(`slug`);

-- CreateIndex
CREATE UNIQUE INDEX `Product_sku_key` ON `Product`(`sku`);

-- CreateIndex
CREATE INDEX `Product_status_idx` ON `Product`(`status`);

-- CreateIndex
CREATE INDEX `Product_isFeatured_idx` ON `Product`(`isFeatured`);

-- CreateIndex
CREATE INDEX `Product_isNewArrival_idx` ON `Product`(`isNewArrival`);

-- CreateIndex
CREATE UNIQUE INDEX `Category_slug_key` ON `Category`(`slug`);

-- CreateIndex
CREATE UNIQUE INDEX `Subcategory_slug_categoryId_key` ON `Subcategory`(`slug`, `categoryId`);

-- AddForeignKey
ALTER TABLE `Inquiry` ADD CONSTRAINT `Inquiry_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InquiryItem` ADD CONSTRAINT `InquiryItem_inquiryId_fkey` FOREIGN KEY (`inquiryId`) REFERENCES `Inquiry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InquiryItem` ADD CONSTRAINT `InquiryItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InquiryStatusHistory` ADD CONSTRAINT `InquiryStatusHistory_inquiryId_fkey` FOREIGN KEY (`inquiryId`) REFERENCES `Inquiry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InquiryStatusHistory` ADD CONSTRAINT `InquiryStatusHistory_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_RelatedProducts` ADD CONSTRAINT `_RelatedProducts_A_fkey` FOREIGN KEY (`A`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_RelatedProducts` ADD CONSTRAINT `_RelatedProducts_B_fkey` FOREIGN KEY (`B`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


-- The first (oldest) admin becomes SUPER_ADMIN so someone can manage admin users
UPDATE `Admin` SET `role` = 'SUPER_ADMIN' ORDER BY `id` ASC LIMIT 1;
