ALTER TABLE users ADD INDEX `uidx_users_username` (`username`);

ALTER TABLE entries DROP INDEX `idx_entries_user`;
ALTER TABLE entries RENAME COLUMN user TO userId;
ALTER TABLE entries RENAME COLUMN createdTZOffset TO createdTzOffset;
ALTER TABLE entries RENAME COLUMN entry TO body;
ALTER TABLE entries RENAME COLUMN label TO labelId;
ALTER TABLE entries CHANGE `wordCount` `wordCount` INT NOT NULL;
ALTER TABLE entries ADD INDEX `idx_entries_userId`  (`userId`);
ALTER TABLE entries ADD INDEX `idx_entries_labelId` (`userId`, `labelId`);

ALTER TABLE entryEdits RENAME COLUMN created TO created;
ALTER TABLE entryEdits RENAME COLUMN createdTZOffset TO createdTzOffset;
ALTER TABLE entryEdits RENAME COLUMN title TO oldTitle;
ALTER TABLE entryEdits RENAME COLUMN entry TO oldBody;
ALTER TABLE entryEdits RENAME COLUMN label TO oldLabelId;
ALTER TABLE entryEdits ADD COLUMN userId char(32) NOT NULL AFTER id;
ALTER TABLE entryEdits ADD INDEX `idx_entryEdits_userId`  (`userId`);
ALTER TABLE entryEdits ADD INDEX `idx_entryEdits_entryId` (`userId`, `entryId`);

ALTER TABLE events DROP INDEX `idx_events_user`;
ALTER TABLE events RENAME COLUMN user TO userId;
ALTER TABLE events RENAME COLUMN label TO labelId;
ALTER TABLE events ADD INDEX `idx_events_userId`  (`userId`);
ALTER TABLE events ADD INDEX `idx_events_labelId` (`userId`, `labelId`);

ALTER TABLE labels DROP INDEX `idx_labels_user`;
ALTER TABLE labels RENAME COLUMN user TO userId;
ALTER TABLE labels ADD INDEX `idx_labels_userId` (`userId`);
ALTER TABLE labels ADD INDEX `idx_labels_name`   (`userId`, `name`);

ALTER TABLE assets DROP INDEX `idx_assets_user`;
ALTER TABLE assets DROP INDEX `idx_assets_publicId`;
ALTER TABLE assets RENAME COLUMN user TO userId;
ALTER TABLE assets CHANGE `publicId` `publicId` varchar(128) NOT NULL;
ALTER TABLE assets ADD INDEX `idx_assets_userId`   (`userId`);
ALTER TABLE assets ADD INDEX `idx_assets_publicId` (`userId`, `publicId`);

ALTER TABLE settings DROP INDEX `idx_settings_user`;
ALTER TABLE settings RENAME COLUMN user TO userId;
ALTER TABLE settings ADD INDEX `idx_settings_userId` (`userId`);

ALTER TABLE locations DROP INDEX `idx_locations_user`;
ALTER TABLE locations RENAME COLUMN user TO userId;
ALTER TABLE locations DROP COLUMN createdTZOffset;
ALTER TABLE locations ADD INDEX `idx_locations_userId` (`userId`);

ALTER TABLE pageLoads RENAME COLUMN user TO userId;
ALTER TABLE pageLoads ADD INDEX `idx_pageLoads_userId`  (`userId`);
ALTER TABLE pageLoads ADD INDEX `idx_pageLoads_created` (`created`);
ALTER TABLE pageLoads ADD INDEX `idx_pageLoads_route`   (`route`);

DROP TABLE datasets;
CREATE TABLE datasets
(
    id       char(32)     NOT NULL,
    userId   char(32)     NOT NULL,
    created  int          NOT NULL,
    name     varchar(256) NOT NULL,
    presetId char(32)     DEFAULT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_datasets_userId` (`userId`)
)
    ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_bin;

DROP TABLE datasetColumns;
CREATE TABLE datasetColumns
(
    id        char(32)     NOT NULL,
    userId    char(32)     NOT NULL,
    datasetId char(32)     NOT NULL,
    ordering  int          NOT NULL,
    created   int          NOT NULL,
    name      varchar(256) NOT NULL,
    typeId    char(32)     NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_datasetColumns_userId`    (`userId`),
    INDEX `idx_datasetColumns_datasetId` (`userId`, `datasetId`)
)
    ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_bin;

DROP TABLE datasetRows;
CREATE TABLE datasetRows
(
    id                int      NOT NULL,
    userId            char(32) NOT NULL,
    datasetId         char(32) NOT NULL,
    created           int      NOT NULL,
    timestamp         int      NOT NULL,
    timestampTzOffset double   NOT NULL,
    rowJson           longtext NOT NULL,
    INDEX `idx_datasetRows_userId`               (`userId`),
    INDEX `idx_datasetRows_datasetId`            (`userId`, `datasetId`),
    UNIQUE INDEX `uidx_datasetRows_id_datasetId` (`id`, `userId`, `datasetId`)
)
    ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_bin;

DROP TABLE datasetColumnTypes;

DROP TABLE datasetElements;

