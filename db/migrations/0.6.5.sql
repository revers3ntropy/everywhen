CREATE TABLE wordsInEntries
(
    userId  char(32)     NOT NULL,
    entryId char(32)     NOT NULL,
    word    varchar(256) NOT NULL,
    count   int          NOT NULL,
    INDEX `idx_wordsInEntries_userId`  (`userId`),
    INDEX `idx_wordsInEntries_word`    (`userId`, `word`),
    INDEX `idx_wordsInEntries_entryId` (`userId`, `entryId`),
    INDEX `idx_wordsInEntries_count`   (`userId`, `count`),
    UNIQUE INDEX `uidx_wordsInEntries_word_entryId` (`userId`, `word`, `entryId`)
)
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE utf8mb4_bin;