CREATE TABLE users
(
    id                  char(32)     NOT NULL,
    username            varchar(255) NOT NULL,
    password            varchar(255) NOT NULL,
    salt                varchar(255) NOT NULL,
    created             int          NOT NULL,
    versionLastLoggedIn varchar(32)  NOT NULL DEFAULT '0.5.86',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `uidx_users_username` (`username`)
)
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE utf8mb4_bin;


CREATE TABLE subscriptions
(
    userId               char(32)     NOT NULL,
    stripeCustomerId     varchar(256) NOT NULL,
    stripeSubscriptionId varchar(256) NOT NULL,
    subType              varchar(64)  NOT NULL,
    active               tinyint      NOT NULL,
    INDEX `idx_subscriptions_userId` (`userId`)
)
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE utf8mb4_bin;


CREATE TABLE entries
(
    id              char(32) NOT NULL,
    userId          char(32) NOT NULL,
    created         int      NOT NULL,
    createdTzOffset double   NOT NULL,
    day             CHAR(10) NOT NULL,
    latitude        double   DEFAULT NULL,
    longitude       double   DEFAULT NULL,
    title           text     NOT NULL,
    body            longtext NOT NULL,
    labelId         char(32) DEFAULT NULL,
    deleted         int      DEFAULT NULL,
    pinned          int      DEFAULT NULL,
    agentData       longtext NOT NULL,
    wordCount       int      NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_entries_userId`  (`userId`),
    INDEX `idx_entries_created` (`created`),
    INDEX `idx_entries_labelId` (`userId`, `labelId`),
    INDEX `idx_entries_userId_created_deleted` (`userId`, `created`, `deleted`),
    INDEX `idx_entries_lat` (`userId`, `latitude`),
    INDEX `idx_entries_lon` (`userId`, `longitude`),
    INDEX `idx_entries_lat_lon` (`userId`, `latitude`, `longitude`),
    INDEX `idx_entries_day` (`userId`, `day`)
)
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE utf8mb4_bin;


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


CREATE TABLE entryEdits
(
    id              char(32) NOT NULL,
    userId          char(32) NOT NULL,
    entryId         char(32) NOT NULL,
    created         int      NOT NULL,
    createdTzOffset double   NOT NULL,
    latitude        double   DEFAULT NULL,
    longitude       double   DEFAULT NULL,
    agentData       longtext NOT NULL,
    oldTitle        text     NULL,
    oldBody         longtext NOT NULL,
    oldLabelId      char(32) DEFAULT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_entryEdits_userId` (`userId`),
    INDEX `idx_entryEdits_created` (`created`),
    INDEX `idx_entryEdits_entryId` (`userId`, `entryId`)
)
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE utf8mb4_bin;


CREATE TABLE events
(
    id       char(32)      NOT NULL,
    userId   char(32)      NOT NULL,
    name     varchar(256)  NOT NULL,
    start    bigint signed NOT NULL,
    end      bigint signed NOT NULL,
    tzOffset double        NOT NULL,
    labelId  char(32)      DEFAULT NULL,
    created  int           NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_events_userId`  (`userId`),
    INDEX `idx_events_created`  (`created`),
    INDEX `idx_events_labelId` (`userId`, `labelId`)
)
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE utf8mb4_bin;


CREATE TABLE labels
(
    id      char(32)     NOT NULL,
    userId  char(32)     NOT NULL,
    name    varchar(256) NOT NULL,
    color   varchar(64)  NOT NULL,
    created int          NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_labels_userId` (`userId`),
    INDEX `idx_labels_name`   (`userId`, `name`)
)
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE utf8mb4_bin;


CREATE TABLE assets
(
    id          char(32)     NOT NULL,
    # publicId is unique per user and allows same
    # public id to be used for different users
    # (for instance when importing a backup into a different
    # account, which will duplicate IDs).
    # Length at least 36 to support old UUID formats (pre 0.5.15),
    # which included dashes
    publicId    varchar(128) NOT NULL,
    userId      char(32)     NOT NULL,
    created     int          NOT NULL,
    fileName    varchar(256) NOT NULL,
    content     longtext     NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_assets_userId`     (`userId`),
    INDEX `idx_assets_publicId` (`userId`, `publicId`)
)
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE utf8mb4_bin;


CREATE TABLE settings
(
    id      char(32)     NOT NULL,
    userId  char(32)     NOT NULL,
    created int          NOT NULL,
    `key`   varchar(256) NOT NULL,
    `value` longtext     NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_settings_userId` (`userId`)
)
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE utf8mb4_bin;


CREATE TABLE locations
(
    id              char(32)     NOT NULL,
    userId          char(32)     NOT NULL,
    created         int          NOT NULL,
    name            varchar(256) NOT NULL,
    latitude        double       NOT NULL,
    longitude       double       NOT NULL,
    radius          double       NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_locations_userId` (`userId`)
)
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE utf8mb4_bin;


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
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE utf8mb4_bin;


CREATE TABLE datasetColumns
(
    id           char(32)     NOT NULL,
    userId       char(32)     NOT NULL,
    datasetId    char(32)     NOT NULL,
    ordering     int          NOT NULL,
    jsonOrdering int          NOT NULL,
    created      int          NOT NULL,
    name         varchar(256) NOT NULL,
    typeId       char(32)     NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_datasetColumns_userId`    (`userId`),
    INDEX `idx_datasetColumns_datasetId` (`userId`, `datasetId`)
)
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE utf8mb4_bin;


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
    INDEX `idx_datasetRows_created`              (`created`),
    INDEX `idx_datasetRows_timestamp`            (`timestamp`),
    UNIQUE INDEX `uidx_datasetRows_id_datasetId` (`id`, `userId`, `datasetId`)
)
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE utf8mb4_bin;


CREATE TABLE ids
(
    id char(32) NOT NULL,
    PRIMARY KEY (id)
)
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE utf8mb4_bin;
