ALTER TABLE datasets
ADD COLUMN
    rowCount int NOT NULL
AFTER presetId;

UPDATE datasets
SET rowCount = (
    SELECT COUNT(*)
    FROM datasetRows
    WHERE datasetId = datasets.id
)