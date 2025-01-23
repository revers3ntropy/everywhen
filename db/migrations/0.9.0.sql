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