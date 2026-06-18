const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const { runMigrations } = require("./migrations/runMigrations");

let sqliteDb = null;

async function connectSQLite() {
  sqliteDb = await open({
    filename: process.env.SQLITE_PATH || "./faq_fallback.sqlite",
    driver: sqlite3.Database
  });

  await sqliteDb.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS user_queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      question TEXT NOT NULL,
      answer TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      source TEXT DEFAULT 'frontend',
      description TEXT DEFAULT '',
      category TEXT DEFAULT 'General',
      tags TEXT DEFAULT '',
      user_id TEXT DEFAULT 'anonymous',
      author_name TEXT DEFAULT 'Anonymous',
      promoted INTEGER DEFAULT 0,
      synced_to_mongo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      keywords TEXT DEFAULT '',
      category TEXT DEFAULT 'General',
      tags TEXT DEFAULT '',
      search_boost REAL DEFAULT 1,
      user_id TEXT DEFAULT 'anonymous',
      author_name TEXT DEFAULT 'Anonymous',
      source_query_id TEXT,
      synced_to_mongo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'student',
      badges TEXT DEFAULT '',
      cohort TEXT DEFAULT '',
      questions_count INTEGER DEFAULT 0,
      answers_count INTEGER DEFAULT 0,
      reputation INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      question_id TEXT,
      query_id TEXT,
      content TEXT NOT NULL,
      author TEXT DEFAULT 'Community Member',
      user_id TEXT DEFAULT 'anonymous',
      author_name TEXT DEFAULT 'Community Member',
      votes INTEGER DEFAULT 0,
      is_best INTEGER DEFAULT 0,
      synced_to_mongo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      user_id TEXT DEFAULT 'anonymous',
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      value INTEGER DEFAULT 1,
      synced_to_mongo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, target_type, target_id)
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      user_id TEXT DEFAULT 'anonymous',
      question_id TEXT NOT NULL,
      synced_to_mongo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, question_id)
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      user_id TEXT DEFAULT 'anonymous',
      followable_type TEXT NOT NULL,
      followable_id TEXT NOT NULL,
      is_muted INTEGER DEFAULT 0,
      synced_to_mongo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, followable_type, followable_id)
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      user_id TEXT NOT NULL,
      follow_id TEXT,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      event_type TEXT DEFAULT '',
      followable_type TEXT DEFAULT '',
      followable_id TEXT DEFAULT '',
      synced_to_mongo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      type TEXT NOT NULL,
      user_id TEXT DEFAULT 'anonymous',
      target_type TEXT DEFAULT '',
      target_id TEXT DEFAULT '',
      metadata TEXT DEFAULT '{}',
      synced_to_mongo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await runMigrations(sqliteDb);

  console.log("SQLite fallback ready");
}

function getSQLiteDb() {
  if (!sqliteDb) {
    throw new Error("SQLite database not initialized");
  }

  return sqliteDb;
}

async function closeSQLite() {
  if (sqliteDb) {
    await sqliteDb.close();
    sqliteDb = null;
  }
}

module.exports = {
  connectSQLite,
  getSQLiteDb,
  closeSQLite
};
