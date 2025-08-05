ALTER TABLE datasets
    ADD COLUMN
        showInFeed int NOT NULL DEFAULT 0
    AFTER rowCount;