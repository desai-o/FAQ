-- Add a `username` column to the users table so Edit Profile can persist
-- a display handle separately from `name`. Stored as plain TEXT (the app
-- layer lowercases for case-insensitive uniqueness, matching how
-- email is normalized). Empty string is the default so existing rows
-- and new rows from the CREATE TABLE in sqlite.js stay consistent.
--
-- The migration runner swallows "duplicate column name" errors, so
-- re-running against an already-migrated database is a safe no-op.

ALTER TABLE users ADD COLUMN username TEXT DEFAULT '';
