ALTER TABLE datasets
ADD COLUMN
    rowCount int NOT NULL
AFTER presetId;