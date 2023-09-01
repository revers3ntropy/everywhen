DROP TABLE datasetColumns;
DROP TABLE datasetColumnTypes;
DROP TABLE datasetElements;
DROP TABLE datasetRows;
DROP TABLE datasets;


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

ALTER TABLE datasets       ADD INDEX `idx_datasets_user`       (`userId`);
ALTER TABLE datasetColumns ADD INDEX `idx_datasetColumns_user` (`userId`);
ALTER TABLE datasetRows    ADD INDEX `idx_datasetRows_user`    (`userId`);