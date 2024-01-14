ALTER TABLE entries ADD COLUMN day CHAR(10) NOT NULL AFTER createdTzOffset;
ALTER TABLE entries ADD INDEX `idx_entries_day` (`userId`, `day`);
# get around 'FROM_UNIXTIME' not supporting negative values
UPDATE entries SET day = DATE_FORMAT(DATE_ADD('1970-01-01 00:00:00', INTERVAL created + createdTzOffset * 60 * 60 SECOND), '%Y-%m-%d');