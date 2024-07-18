-- 0.6.5

CREATE TABLE wordsInEntries
(
    userId         char(32)     NOT NULL,
    entryId        char(32)     NOT NULL,
    entryIsDeleted tinyint      NOT NULL,
    word           varchar(256) NOT NULL,
    count          int          NOT NULL,
    INDEX `idx_wordsInEntries_userId`  (`userId`),
    INDEX `idx_wordsInEntries_word`    (`userId`, `word`),
    INDEX `idx_wordsInEntries_entryId` (`userId`, `entryId`),
    INDEX `idx_wordsInEntries_count`   (`userId`, `count`),
    UNIQUE INDEX `uidx_wordsInEntries_word_entryId` (`userId`, `word`, `entryId`)
)
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE utf8mb4_bin;

-- 0.6.21

ALTER TABLE events ADD COLUMN tzOffset double NOT NULL AFTER end;

-- 0.6.35

ALTER TABLE entries ADD INDEX `idx_created` (`created`);

-- 0.6.36

ALTER TABLE entries DROP INDEX `idx_created`;
ALTER TABLE entries ADD INDEX `idx_entries_created` (`created`);
ALTER TABLE entryEdits ADD INDEX `idx_entryEdits_created` (`created`);
ALTER TABLE events ADD INDEX `idx_events_created` (`created`);
ALTER TABLE datasetRows ADD INDEX `idx_datasetRows_created` (`created`);
ALTER TABLE datasetRows ADD INDEX `idx_datasetRows_timestamp` (`timestamp`);

-- 0.6.40

ALTER TABLE entries ADD INDEX `idx_entries_lat` (`userId`, `latitude`);
ALTER TABLE entries ADD INDEX `idx_entries_lon` (`userId`, `longitude`);
ALTER TABLE entries ADD INDEX `idx_entries_lat_lon` (`userId`, `latitude`, `longitude`);

-- 0.6.42

ALTER TABLE entries ADD COLUMN day CHAR(10) NOT NULL AFTER createdTzOffset;
ALTER TABLE entries ADD INDEX `idx_entries_day` (`userId`, `day`);
# get around 'FROM_UNIXTIME' not supporting negative values
UPDATE entries SET day = DATE_FORMAT(DATE_ADD('1970-01-01 00:00:00', INTERVAL created + createdTzOffset * 60 * 60 SECOND), '%Y-%m-%d');

-- 0.6.51

DROP TABLE pageLoads;

ALTER TABLE events MODIFY COLUMN start bigint signed;
ALTER TABLE events MODIFY COLUMN end bigint signed;