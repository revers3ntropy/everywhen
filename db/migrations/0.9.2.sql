ALTER TABLE users
ADD COLUMN
    stripeCustomerId varchar(256) DEFAULT NULL
AFTER versionLastLoggedIn;

ALTER TABLE subscriptions DROP COLUMN active;