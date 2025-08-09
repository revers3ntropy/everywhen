ALTER TABLE events MODIFY COLUMN name varchar(258) NOT NULL;
UPDATE events SET name = CONCAT('~#', name);
ALTER TABLE locations MODIFY COLUMN name varchar(258) NOT NULL;
UPDATE locations SET name = CONCAT('~#', name);
ALTER TABLE datasets MODIFY COLUMN name varchar(258) NOT NULL;
UPDATE datasets SET name = CONCAT('~#', name);
ALTER TABLE datasetColumns MODIFY COLUMN name varchar(258) NOT NULL;
UPDATE datasetColumns SET name = CONCAT('~#', name);