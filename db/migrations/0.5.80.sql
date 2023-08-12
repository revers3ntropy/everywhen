ALTER TABLE assets ADD INDEX `idx_assets_user` (`user`);
ALTER TABLE entries ADD INDEX `idx_entries_user` (`user`);
ALTER TABLE datasets ADD INDEX `idx_datasets_user` (`user`);
ALTER TABLE events ADD INDEX `idx_events_user` (`user`);
ALTER TABLE labels ADD INDEX `idx_labels_user` (`user`);
ALTER TABLE locations ADD INDEX `idx_locations_user` (`user`);
ALTER TABLE settings ADD INDEX `idx_settings_user` (`user`);