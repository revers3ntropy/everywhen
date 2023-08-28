ALTER TABLE entries ADD deleted INT DEFAULT NULL;
ALTER TABLE entries ADD pinned INT DEFAULT NULL;

UPDATE entries
SET deleted = UNIX_TIMESTAMP()
WHERE flags = 1 OR flags = 3;

UPDATE entries
SET pinned = UNIX_TIMESTAMP()
WHERE flags = 2 OR flags = 3;

ALTER TABLE entries DROP COLUMN flags;