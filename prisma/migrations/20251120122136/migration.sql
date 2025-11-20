-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    `reset_password_token` VARCHAR(255) NULL,
    `reset_password_token_expires` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scripts` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `script_url` VARCHAR(255) NOT NULL,
    `description` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `licenses` (
    `id` CHAR(36) NOT NULL,
    `license_key` VARCHAR(100) NOT NULL,
    `status` ENUM('active', 'banned', 'expired') NOT NULL DEFAULT 'active',
    `expiry_date` DATETIME(3) NULL,
    `days` INTEGER NULL,
    `bound_userid` VARCHAR(100) NULL,
    `bound_device_id` VARCHAR(255) NULL,
    `max_devices` INTEGER NOT NULL DEFAULT 1,
    `script_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `licenses_license_key_key`(`license_key`),
    INDEX `licenses_script_id_idx`(`script_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `active_sessions` (
    `id` CHAR(36) NOT NULL,
    `license_key` VARCHAR(100) NOT NULL,
    `user_id` VARCHAR(100) NOT NULL,
    `device_id` VARCHAR(255) NOT NULL,
    `expiry_timestamp` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `active_sessions_license_key_idx`(`license_key`),
    INDEX `active_sessions_user_id_idx`(`user_id`),
    INDEX `active_sessions_device_id_idx`(`device_id`),
    UNIQUE INDEX `active_sessions_license_key_user_id_device_id_key`(`license_key`, `user_id`, `device_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `license_logs` (
    `id` CHAR(36) NOT NULL,
    `license_key` VARCHAR(100) NOT NULL,
    `user_id` VARCHAR(100) NULL,
    `device_id` VARCHAR(255) NULL,
    `action` VARCHAR(50) NOT NULL,
    `message` VARCHAR(255) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `license_logs_license_key_idx`(`license_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `licenses` ADD CONSTRAINT `licenses_script_id_fkey` FOREIGN KEY (`script_id`) REFERENCES `scripts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `active_sessions` ADD CONSTRAINT `active_sessions_license_key_fkey` FOREIGN KEY (`license_key`) REFERENCES `licenses`(`license_key`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `license_logs` ADD CONSTRAINT `license_logs_license_key_fkey` FOREIGN KEY (`license_key`) REFERENCES `licenses`(`license_key`) ON DELETE RESTRICT ON UPDATE CASCADE;
