CREATE TABLE dataSet
(
    id      char(32)     NOT NULL,
    user    char(32)     NOT NULL,
    created int(64)      NOT NULL,
    name    varchar(256) NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = latin1;

CREATE TABLE dataSetColumnType
(
    id      char(32)     NOT NULL,
    user    char(32)     NOT NULL,
    created int(64)      NOT NULL,
    name    varchar(256) NOT NULL,
    unit    varchar(32)  NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = latin1;

CREATE TABLE dataSetColumn
(
    id      char(32)     NOT NULL,
    dataSet char(32)     NOT NULL,
    created int(64)      NOT NULL,
    name    varchar(256) NOT NULL,
    type    char(32)     NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = latin1;

CREATE TABLE dataSetRow
(
    id                char(32)     NOT NULL,
    dataSet           char(32)     NOT NULL,
    created           int(64)      NOT NULL,
    timestamp         int(64)      NOT NULL,
    timestampTzOffset double       NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = latin1;

CREATE TABLE dataSetElement
(
    dataSet           char(32)     NOT NULL,
    `column` char(32)      NOT NULL,
    row      char(32)      NOT NULL,
    data     varchar(2048) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = latin1;