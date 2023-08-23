ALTER TABLE assets ADD INDEX `idx_assets_publicId` (`publicId`);
ALTER TABLE `users` ADD `versionLastLoggedIn` VARCHAR(32) NOT NULL DEFAULT '0.5.86' AFTER `created`;