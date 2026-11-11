-- Random code for order links shared on WhatsApp (link previews)
ALTER TABLE `Inquiry` ADD COLUMN `shareToken` VARCHAR(32) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Inquiry_shareToken_key` ON `Inquiry`(`shareToken`);
