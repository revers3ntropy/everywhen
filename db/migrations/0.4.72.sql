ALTER TABLE `entries`
    ADD `flags` INT(8) NOT NULL DEFAULT '0';

UPDATE `entries` SET `flags` = 1 WHERE `deleted` = 1;

ALTER TABLE `entries` DROP `deleted`;
