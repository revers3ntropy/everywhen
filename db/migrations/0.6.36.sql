ALTER TABLE entries DROP INDEX `idx_created`;
ALTER TABLE entries ADD INDEX `idx_entries_created` (`created`);
ALTER TABLE entryEdits ADD INDEX `idx_entryEdits_created` (`created`);
ALTER TABLE events ADD INDEX `idx_events_created` (`created`);
ALTER TABLE datasetRows ADD INDEX `idx_datasetRows_created` (`created`);
ALTER TABLE datasetRows ADD INDEX `idx_datasetRows_timestamp` (`timestamp`);