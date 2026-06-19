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
      moderation_status TEXT DEFAULT 'approved',
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
      stale_score REAL DEFAULT 0,
      last_reviewed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      needs_update INTEGER DEFAULT 0,
      update_reason TEXT DEFAULT '',
      moderation_status TEXT DEFAULT 'approved',
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
      is_verified INTEGER DEFAULT 0,
      verified_by TEXT DEFAULT NULL,
      verified_at TEXT DEFAULT NULL,
      verification_note TEXT DEFAULT NULL,
      moderation_status TEXT DEFAULT 'approved',
      synced_to_mongo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS faq_revisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faq_id TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT DEFAULT '',
      user_id TEXT,
      author_name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS query_revisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query_id TEXT NOT NULL,
      question TEXT NOT NULL,
      description TEXT DEFAULT '',
      answer TEXT DEFAULT '',
      category TEXT NOT NULL,
      tags TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      user_id TEXT,
      author_name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS answer_revisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      answer_id TEXT NOT NULL,
      content TEXT NOT NULL,
      user_id TEXT,
      author_name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
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

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS moderation_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      flagged INTEGER DEFAULT 0,
      confidence REAL DEFAULT 0.0,
      categories TEXT,
      reason TEXT,
      status TEXT DEFAULT 'needs_review',
      reviewed_by TEXT,
      reviewed_at TEXT,
      audit_trail TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS duplicate_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      source_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      similarity REAL DEFAULT 0.0,
      explanation TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS search_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      user_id TEXT,
      results_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS chat_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      user_id TEXT,
      message TEXT NOT NULL,
      response TEXT NOT NULL,
      retrieved_faqs TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS faq_translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      faq_id TEXT NOT NULL,
      language TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      translated_by TEXT DEFAULT 'ai',
      translation_provenance TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(faq_id, language)
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS bounties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      query_id TEXT NOT NULL,
      amount INTEGER DEFAULT 0,
      created_by TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      winner_id TEXT,
      winner_answer_id TEXT,
      expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      user_id TEXT UNIQUE NOT NULL,
      email_notifications INTEGER DEFAULT 1,
      in_app_notifications INTEGER DEFAULT 1,
      digest_frequency TEXT DEFAULT 'none',
      tag_preferences TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
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
