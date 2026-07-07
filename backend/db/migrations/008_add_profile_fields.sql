-- Add profile bio and location fields to the users table so the
-- Edit Profile feature can persist them. The Mongo User model gains the
-- same fields, both storages stay in sync via the PATCH /auth/me route.
-- The migration runner swallows "duplicate column name" errors, so re-running
-- against an already-migrated database is a safe no-op.

ALTER TABLE users ADD COLUMN bio TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN location TEXT DEFAULT '';
