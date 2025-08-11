ALTER TABLE assets MODIFY COLUMN fileName varchar(258) NOT NULL;
UPDATE assets SET fileName = CONCAT('~#', fileName);
UPDATE assets SET content = CONCAT('~#', content);