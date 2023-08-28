START TRANSACTION;

CREATE TABLE users
(
    id                  char(32)     NOT NULL,
    username            varchar(255) NOT NULL,
    password            varchar(255) NOT NULL,
    salt                varchar(255) NOT NULL,
    created             int(64)      NOT NULL,
    versionLastLoggedIn varchar(32)  NOT NULL DEFAULT '0.5.86',
    PRIMARY KEY (id)
) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;

CREATE TABLE entries
(
    id              char(32)     NOT NULL,
    user            char(32)     NOT NULL,
    created         int(64)      NOT NULL,
    createdTZOffset double       NOT NULL,
    latitude        double       DEFAULT NULL,
    longitude       double       DEFAULT NULL,
    title           text         NULL,
    entry           longtext     NOT NULL,
    label           char(32)     DEFAULT NULL,
    deleted         int(64)      DEFAULT NULL,
    pinned          int(64)      DEFAULT NULL,
    agentData       longtext     NOT NULL,
    wordCount       int(32)      NOT NULL DEFAULT -1,
    PRIMARY KEY (id)
) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;

CREATE TABLE entryEdits
(
    id              char(32)    NOT NULL,
    entryId         char(32)    NOT NULL,
    created         int(64)      NOT NULL,
    createdTZOffset double       NOT NULL,
    latitude        double       DEFAULT NULL,
    longitude       double       DEFAULT NULL,
    title           text         NULL,
    entry           longtext     NOT NULL,
    label           char(32)     DEFAULT NULL,
    agentData       longtext     NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;

CREATE TABLE events
(
    id      char(32)     NOT NULL,
    user    char(32)     NOT NULL,
    name    varchar(256) NOT NULL,
    start   int(64)      NOT NULL,
    end     int(64)      NOT NULL,
    label   char(32)     DEFAULT NULL,
    created int(64)      NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;

CREATE TABLE labels
(
    id      char(32)     NOT NULL,
    user    char(32)     NOT NULL,
    name    varchar(256) NOT NULL,
    color   varchar(64)  NOT NULL,
    created int(64)      NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;

CREATE TABLE assets
(
    id          char(32)     NOT NULL,
    # publicId is unique per user and allows same
    # public id to be used for different users
    # (for instance when importing a backup into a different
    # account, which will duplicate IDs)
    # Length 36 to support old UUID formats (pre 0.5.15)
    # which included dashes
    publicId    char(36)     NOT NULL,
    user        char(32)     NOT NULL,
    created     int(64)      NOT NULL,
    fileName    varchar(256) NOT NULL,
    content     longtext     NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;

CREATE TABLE settings
(
    id      char(32)     NOT NULL,
    user    char(32)     NOT NULL,
    created int(64)      NOT NULL,
    `key`   varchar(256) NOT NULL,
    value   longtext     NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;

CREATE TABLE locations
(
    id              char(32)     NOT NULL,
    user            char(32)     NOT NULL,
    created         int(64)      NOT NULL,
    createdTZOffset double       NOT NULL,
    name            varchar(256) NOT NULL,
    latitude        double       NOT NULL,
    longitude       double       NOT NULL,
    radius          double       NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;

CREATE TABLE pageLoads
(
    user         char(32)     DEFAULT NULL,
    created      int(64)      NOT NULL,
    method       varchar(64)  NOT NULL,
    url          varchar(512) NOT NULL,
    route        varchar(256) NOT NULL,
    loadTimeMs   real         NOT NULL,
    responseCode int(64)      NOT NULL,
    userAgent    varchar(512) NOT NULL,
    requestSize  int(64)      NOT NULL,
    responseSize int(64)      NOT NULL,
    ipAddress    varchar(64)  DEFAULT NULL
) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;

CREATE TABLE datasets
(
    id      char(32)     NOT NULL,
    user    char(32)     NOT NULL,
    created int(64)      NOT NULL,
    name    varchar(256) NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;

CREATE TABLE datasetColumnTypes
(
    id      char(32)     NOT NULL,
    user    char(32)     NOT NULL,
    created int(64)      NOT NULL,
    name    varchar(256) NOT NULL,
    unit    varchar(32)  NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;

CREATE TABLE datasetColumns
(
    id      int(32)      NOT NULL,
    dataset char(32)     NOT NULL,
    created int(64)      NOT NULL,
    name    varchar(256) NOT NULL,
    type    char(32)     NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;

CREATE TABLE datasetRows
(
    id                int(32)     NOT NULL,
    dataset           char(32)     NOT NULL,
    created           int(64)      NOT NULL,
    timestamp         int(64)      NOT NULL,
    timestampTzOffset double       NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;

CREATE TABLE datasetElements
(
    dataset  char(32)      NOT NULL,
    `column` int(32)       NOT NULL,
    `row`    int(32)       NOT NULL,
    data     varchar(2048) NOT NULL
) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;

CREATE TABLE ids
(
    id char(32) NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4;

CREATE UNIQUE INDEX uidx_users_username
    ON users (username);

ALTER TABLE assets ADD INDEX `idx_assets_user` (`user`);
ALTER TABLE assets ADD INDEX `idx_assets_publicId` (`publicId`);
ALTER TABLE entries ADD INDEX `idx_entries_user` (`user`);
ALTER TABLE datasets ADD INDEX `idx_datasets_user` (`user`);
ALTER TABLE events ADD INDEX `idx_events_user` (`user`);
ALTER TABLE labels ADD INDEX `idx_labels_user` (`user`);
ALTER TABLE locations ADD INDEX `idx_locations_user` (`user`);
ALTER TABLE settings ADD INDEX `idx_settings_user` (`user`);

COMMIT;