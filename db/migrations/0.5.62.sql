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
    id      char(32)     NOT NULL,
    dataset char(32)     NOT NULL,
    created int(64)      NOT NULL,
    name    varchar(256) NOT NULL,
    type    char(32)     NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = latin1;

CREATE TABLE datasetRows
(
    id                char(32)     NOT NULL,
    dataset           char(32)     NOT NULL,
    created           int(64)      NOT NULL,
    timestamp         int(64)      NOT NULL,
    timestampTzOffset double       NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = latin1;

CREATE TABLE datasetElements
(
    dataset  char(32)      NOT NULL,
    `column` char(32)      NOT NULL,
    `row`    char(32)      NOT NULL,
    data     varchar(2048) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = latin1;
