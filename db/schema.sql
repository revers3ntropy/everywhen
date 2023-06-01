/*!40101 SET @OLD_CHARACTER_SET_CLIENT = @@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS = @@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION = @@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

CREATE TABLE users
(
    id       char(128) NOT NULL,
    username varchar(255) NOT NULL,
    password varchar(255) NOT NULL,
    salt     varchar(255) NOT NULL,
    created  int(64)      NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY username (username)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- --------------------------------------------------------

CREATE TABLE entries
(
    id              char(128) NOT NULL,
    user            char(128) NOT NULL,
    created         int(64)      NOT NULL,
    createdTZOffset double       NOT NULL,
    latitude        double       DEFAULT NULL,
    longitude       double       DEFAULT NULL,
    title           text         NULL,
    entry           longtext     NOT NULL,
    deleted         int(1)       DEFAULT 0,
    label           varchar(128) DEFAULT NULL,
    agentData       longtext     NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = latin1;

-- --------------------------------------------------------

CREATE TABLE entryEdits
(
    id              char(128) NOT NULL,
    entryId         char(128) NOT NULL,
    created         int(64)      NOT NULL,
    createdTZOffset double       NOT NULL,
    latitude        double       DEFAULT NULL,
    longitude       double       DEFAULT NULL,
    title           text         NULL,
    entry           longtext     NOT NULL,
    label           varchar(128) DEFAULT NULL,
    agentData       longtext     NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = latin1;

-- --------------------------------------------------------

CREATE TABLE events
(
    id      char(128) NOT NULL,
    user    char(128) NOT NULL,
    name    varchar(256) NOT NULL,
    start   int(64)      NOT NULL,
    end     int(64)      NOT NULL,
    label   varchar(128) DEFAULT NULL,
    created int(64)      NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = latin1;

-- --------------------------------------------------------

CREATE TABLE labels
(
    id      char(128) NOT NULL,
    user    char(128) NOT NULL,
    name    varchar(256) NOT NULL,
    colour  varchar(64)  NOT NULL,
    created int(64)      NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = latin1;

-- --------------------------------------------------------

CREATE TABLE assets
(
    id          char(128) NOT NULL,
    # publicId is unique per user and allows same
    # public id to be used for different users
    # (for instance when importing a backup into a different
    # account, which will duplicate IDs)
    publicId    char(128) NOT NULL,
    user        char(128) NOT NULL,
    created     int(64)      NOT NULL,
    fileName    varchar(256) NOT NULL,
    contentType varchar(128) NOT NULL,
    content     longtext     NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = latin1;

-- --------------------------------------------------------

CREATE TABLE settings
(
    id      char(128) NOT NULL,
    user    char(128) NOT NULL,
    created int(64)      NOT NULL,
    `key`     varchar(256) NOT NULL,
    value   longtext     NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = latin1;

-- --------------------------------------------------------

CREATE TABLE locations
(
    id              char(128) NOT NULL,
    user            char(128) NOT NULL,
    created         int(64)      NOT NULL,
    createdTZOffset double       NOT NULL,
    name            varchar(256) NOT NULL,
    latitude        double       NOT NULL,
    longitude       double       NOT NULL,
    radius          double       NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = latin1;

-- --------------------------------------------------------

CREATE TABLE pageLoads
(
    user         char(128)    DEFAULT NULL,
    created      int(64)      NOT NULL,
    method       varchar(64)  NOT NULL,
    url          varchar(512) NOT NULL,
    route        varchar(256) NOT NULL,
    loadTimeMs   real         NOT NULL,
    responseCode int(64)      NOT NULL,
    userAgent    varchar(512) NOT NULL,
    requestSize  int(64)      NOT NULL,
    responseSize int(64)      NOT NULL
) ENGINE = InnoDB
  DEFAULT CHARSET = latin1;

-- --------------------------------------------------------

CREATE TABLE ids
(
    id varchar(128) NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = latin1;

/*!40101 SET CHARACTER_SET_CLIENT = @OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS = @OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION = @OLD_COLLATION_CONNECTION */;