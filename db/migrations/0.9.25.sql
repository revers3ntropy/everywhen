CREATE TABLE logs
(
    id         int          AUTO_INCREMENT,
    userId     char(32)     DEFAULT NULL,
    created    int          NOT NULL,
    level      varchar(8)   NOT NULL,
    fromClient int(1)       DEFAULT 0,
    message    varchar(255) NOT NULL,
    context    longtext     DEFAULT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_logs_userId` (`userId`),
    INDEX `idx_logs_created` (`created`)
)
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE utf8mb4_bin;