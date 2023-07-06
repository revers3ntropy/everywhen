ALTER TABLE assets DROP COLUMN contentType;

UPDATE users SET
                 id = regexp_replace(id, '-', '');
ALTER TABLE users
    MODIFY COLUMN id CHAR(32);

UPDATE entries SET
                   id = regexp_replace(id, '-', ''),
                   user = regexp_replace(user, '-', ''),
                   label = regexp_replace(label, '-', '');
ALTER TABLE entries
    MODIFY COLUMN id CHAR(32),
    MODIFY COLUMN user CHAR(32),
    MODIFY COLUMN label CHAR(32);

UPDATE entryEdits SET
                   id = regexp_replace(id, '-', ''),
                   entryId = regexp_replace(entryId, '-', ''),
                   label = regexp_replace(label, '-', '');
ALTER TABLE entryEdits
    MODIFY COLUMN id CHAR(32),
    MODIFY COLUMN entryId CHAR(32),
    MODIFY COLUMN label CHAR(32);

UPDATE events SET
                   id = regexp_replace(id, '-', ''),
                   user = regexp_replace(user, '-', ''),
                   label = regexp_replace(label, '-', '');
ALTER TABLE events
    MODIFY COLUMN id CHAR(32),
    MODIFY COLUMN user CHAR(32),
    MODIFY COLUMN label CHAR(32);

UPDATE labels SET
                  id = regexp_replace(id, '-', ''),
                  user = regexp_replace(user, '-', '');
ALTER TABLE labels
    MODIFY COLUMN id CHAR(32),
    MODIFY COLUMN user CHAR(32);

UPDATE assets SET
                  id = regexp_replace(id, '-', ''),
                  user = regexp_replace(user, '-', '');
ALTER TABLE assets
    MODIFY COLUMN id CHAR(32),
    MODIFY COLUMN user CHAR(32);

UPDATE settings SET
                  id = regexp_replace(id, '-', ''),
                  user = regexp_replace(user, '-', '');
ALTER TABLE settings
    MODIFY COLUMN id CHAR(32),
    MODIFY COLUMN user CHAR(32);

UPDATE locations SET
                    id = regexp_replace(id, '-', ''),
                    user = regexp_replace(user, '-', '');
ALTER TABLE locations
    MODIFY COLUMN id CHAR(32),
    MODIFY COLUMN user CHAR(32);

UPDATE pageLoads SET user = '' WHERE user IS NULL;
UPDATE pageLoads SET
                     user = regexp_replace(user, '-', '');
ALTER TABLE pageLoads
    MODIFY COLUMN user CHAR(32) DEFAULT NULL;
UPDATE pageLoads SET user = NULL WHERE user = '';

UPDATE ids SET
               id = regexp_replace(id, '-', '');
ALTER TABLE ids
    MODIFY COLUMN id CHAR(32);