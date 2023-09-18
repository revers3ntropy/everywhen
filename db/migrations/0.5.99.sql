-- 0.5.15

ALTER TABLE assets DROP COLUMN contentType;

UPDATE users SET
    id = regexp_replace(id, '-', '');
ALTER TABLE users
    MODIFY COLUMN id CHAR(32);

UPDATE entries SET
                   id = regexp_replace(id, '-', ''),
                   user = regexp_replace(user, '-', ''),
                   label = regexp_replace(label, '-', '');
ALTER TABLE entries
    MODIFY COLUMN id CHAR(32),
    MODIFY COLUMN user CHAR(32),
    MODIFY COLUMN label CHAR(32);

UPDATE entryEdits SET
                      id = regexp_replace(id, '-', ''),
                      entryId = regexp_replace(entryId, '-', ''),
                      label = regexp_replace(label, '-', '');
ALTER TABLE entryEdits
    MODIFY COLUMN id CHAR(32),
    MODIFY COLUMN entryId CHAR(32),
    MODIFY COLUMN label CHAR(32);

UPDATE events SET
                  id = regexp_replace(id, '-', ''),
                  user = regexp_replace(user, '-', ''),
                  label = regexp_replace(label, '-', '');
ALTER TABLE events
    MODIFY COLUMN id CHAR(32),
    MODIFY COLUMN user CHAR(32),
    MODIFY COLUMN label CHAR(32);

UPDATE labels SET
                  id = regexp_replace(id, '-', ''),
                  user = regexp_replace(user, '-', '');
ALTER TABLE labels
    MODIFY COLUMN id CHAR(32),
    MODIFY COLUMN user CHAR(32);

UPDATE assets SET
                  id = regexp_replace(id, '-', ''),
                  user = regexp_replace(user, '-', '');
ALTER TABLE assets
    MODIFY COLUMN id CHAR(32),
    MODIFY COLUMN user CHAR(32);

UPDATE settings SET
                    id = regexp_replace(id, '-', ''),
                    user = regexp_replace(user, '-', '');
ALTER TABLE settings
    MODIFY COLUMN id CHAR(32),
    MODIFY COLUMN user CHAR(32);

UPDATE locations SET
                     id = regexp_replace(id, '-', ''),
                     user = regexp_replace(user, '-', '');
ALTER TABLE locations
    MODIFY COLUMN id CHAR(32),
    MODIFY COLUMN user CHAR(32);

UPDATE pageLoads SET user = '' WHERE user IS NULL;
UPDATE pageLoads SET
    user = regexp_replace(user, '-', '');
ALTER TABLE pageLoads
    MODIFY COLUMN user CHAR(32) DEFAULT NULL;
UPDATE pageLoads SET user = NULL WHERE user = '';

UPDATE ids SET
    id = regexp_replace(id, '-', '');
ALTER TABLE ids
    MODIFY COLUMN id CHAR(32);


-- 0.5.21

ALTER TABLE users
    ADD ghAccessToken VARCHAR(255)
        DEFAULT NULL;


-- 0.5.62

CREATE TABLE datasets
(
    id      char(32)     NOT NULL,
    user    char(32)     NOT NULL,
    created int(64)      NOT NULL,
    name    varchar(256) NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = latin1;

CREATE TABLE datasetColumnTypes
(
    id      char(32)     NOT NULL,
    user    char(32)     NOT NULL,
    created int(64)      NOT NULL,
    name    varchar(256) NOT NULL,
    unit    varchar(32)  NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = latin1;

CREATE TABLE datasetColumns
(
    id      int(32)      NOT NULL,
    dataset char(32)     NOT NULL,
    created int(64)      NOT NULL,
    name    varchar(256) NOT NULL,
    type    char(32)     NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = latin1;

CREATE TABLE datasetRows
(
    id                int(32)     NOT NULL,
    dataset           char(32)     NOT NULL,
    created           int(64)      NOT NULL,
    timestamp         int(64)      NOT NULL,
    timestampTzOffset double       NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = latin1;

CREATE TABLE datasetElements
(
    dataset  char(32)      NOT NULL,
    `column` int(32)       NOT NULL,
    `row`    int(32)       NOT NULL,
    data     varchar(2048) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = latin1;


-- 0.5.71

ALTER TABLE `users` DROP `ghAccessToken`;


-- 0.5.80

ALTER TABLE assets ADD INDEX `idx_assets_user` (`user`);
ALTER TABLE entries ADD INDEX `idx_entries_user` (`user`);
ALTER TABLE datasets ADD INDEX `idx_datasets_user` (`user`);
ALTER TABLE events ADD INDEX `idx_events_user` (`user`);
ALTER TABLE labels ADD INDEX `idx_labels_user` (`user`);
ALTER TABLE locations ADD INDEX `idx_locations_user` (`user`);
ALTER TABLE settings ADD INDEX `idx_settings_user` (`user`);


-- 0.5.87

ALTER TABLE assets ADD INDEX `idx_assets_publicId` (`publicId`);
ALTER TABLE `users` ADD `versionLastLoggedIn` VARCHAR(32) NOT NULL DEFAULT '0.5.86' AFTER `created`;


-- 0.5.88

ALTER TABLE `entries` ADD `wordCount` INT NOT NULL DEFAULT '-1' AFTER `flags`;


-- 0.5.94

ALTER TABLE entries ADD deleted INT DEFAULT NULL;
ALTER TABLE entries ADD pinned INT DEFAULT NULL;

UPDATE entries
SET deleted = UNIX_TIMESTAMP()
WHERE flags = 1 OR flags = 3;

UPDATE entries
SET pinned = UNIX_TIMESTAMP()
WHERE flags = 2 OR flags = 3;

ALTER TABLE entries DROP COLUMN flags;


-- 0.5.96

ALTER TABLE assets              CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
ALTER TABLE datasetColumns      CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
ALTER TABLE datasetColumnTypes  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
ALTER TABLE datasetRows         CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
ALTER TABLE datasets            CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
ALTER TABLE entries             CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
ALTER TABLE entryEdits          CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
ALTER TABLE events              CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
ALTER TABLE ids                 CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
ALTER TABLE labels              CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
ALTER TABLE locations           CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
ALTER TABLE pageLoads           CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
ALTER TABLE settings            CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
ALTER TABLE users               CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;


-- 0.5.97

ALTER TABLE users ADD INDEX `uidx_users_username` (`username`);

ALTER TABLE entries DROP INDEX `idx_entries_user`;
ALTER TABLE entries RENAME COLUMN user TO userId;
ALTER TABLE entries RENAME COLUMN createdTZOffset TO createdTzOffset;
ALTER TABLE entries RENAME COLUMN entry TO body;
ALTER TABLE entries RENAME COLUMN label TO labelId;
ALTER TABLE entries CHANGE `wordCount` `wordCount` INT NOT NULL;
ALTER TABLE entries CHANGE `title` `title` text NOT NULL;
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

