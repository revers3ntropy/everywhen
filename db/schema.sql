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
  DEFAULT CHARSET = utf8mb4
  COLLATE utf8mb4_bin;

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
  DEFAULT CHARSET = utf8mb4
  COLLATE utf8mb4_bin;

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
  DEFAULT CHARSET = utf8mb4
  COLLATE utf8mb4_bin;

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
  DEFAULT CHARSET = utf8mb4
  COLLATE utf8mb4_bin;

CREATE TABLE labels
(
    id      char(32)     NOT NULL,
    user    char(32)     NOT NULL,
    name    varchar(256) NOT NULL,
    color   varchar(64)  NOT NULL,
    created int(64)      NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE utf8mb4_bin;

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
  DEFAULT CHARSET = utf8mb4
  COLLATE utf8mb4_bin;

CREATE TABLE settings
(
    id      char(32)     NOT NULL,
    user    char(32)     NOT NULL,
    created int(64)      NOT NULL,
    `key`   varchar(256) NOT NULL,
    value   longtext     NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE utf8mb4_bin;

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
  DEFAULT CHARSET = utf8mb4
  COLLATE utf8mb4_bin;

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
  DEFAULT CHARSET = utf8mb4
  COLLATE utf8mb4_bin;

CREATE TABLE datasets
(
    id       char(32)     NOT NULL,
    userId   char(32)     NOT NULL,
    created  int(64)      NOT NULL,
    name     varchar(256) NOT NULL,
    presetId char(32)     DEFAULT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE utf8mb4_bin;

CREATE TABLE datasetColumns
(
    id        int(32)      NOT NULL,
    userId    char(32)     NOT NULL,
    datasetId char(32)     NOT NULL,
    created   int(64)      NOT NULL,
    name      varchar(256) NOT NULL,
    typeId    char(32)     NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE utf8mb4_bin;

CREATE TABLE datasetRows
(
    id                int(32)      NOT NULL,
    userId            char(32)     NOT NULL,
    datasetId         char(32)     NOT NULL,
    timestamp         int(64)      NOT NULL,
    timestampTzOffset double       NOT NULL,
    rowJson           longtext     NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE utf8mb4_bin;

CREATE TABLE ids
(
    id char(32) NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE utf8mb4_bin;

CREATE UNIQUE INDEX uidx_users_username
    ON users (username);

ALTER TABLE assets              ADD INDEX `idx_assets_user`             (`user`);
ALTER TABLE assets              ADD INDEX `idx_assets_publicId`         (`publicId`);
ALTER TABLE entries             ADD INDEX `idx_entries_user`            (`user`);
ALTER TABLE datasets            ADD INDEX `idx_datasets_user`           (`userId`);
ALTER TABLE datasetColumns      ADD INDEX `idx_datasetColumns_user`     (`userId`);
ALTER TABLE datasetRows         ADD INDEX `idx_datasetRows_user`        (`userId`);
ALTER TABLE events              ADD INDEX `idx_events_user`             (`user`);
ALTER TABLE labels              ADD INDEX `idx_labels_user`             (`user`);
ALTER TABLE locations           ADD INDEX `idx_locations_user`          (`user`);
ALTER TABLE settings            ADD INDEX `idx_settings_user`           (`user`);

COMMIT;