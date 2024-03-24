DROP TABLE pageLoads;

ALTER TABLE events MODIFY COLUMN start bigint signed;
ALTER TABLE events MODIFY COLUMN end bigint signed;