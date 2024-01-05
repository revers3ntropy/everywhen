ALTER TABLE entries ADD INDEX `idx_entries_lat` (`userId`, `latitude`);
ALTER TABLE entries ADD INDEX `idx_entries_lon` (`userId`, `longitude`);
ALTER TABLE entries ADD INDEX `idx_entries_lat_lon` (`userId`, `latitude`, `longitude`);