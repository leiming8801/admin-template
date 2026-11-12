-- CreateTable
CREATE TABLE `file_object` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_type` VARCHAR(20) NOT NULL,
    `owner_id` INTEGER NOT NULL,
    `purpose` VARCHAR(30) NOT NULL,
    `object_key` VARCHAR(500) NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `extension` VARCHAR(20) NOT NULL,
    `size` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `file_object_object_key_key`(`object_key`),
    INDEX `file_object_owner_type_owner_id_idx`(`owner_type`, `owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
