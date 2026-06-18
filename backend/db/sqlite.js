const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

let sqliteDb = null;

async function connectSQLite() {
  sqliteDb = await open({
    filename: process.env.SQLITE_PATH || "./faq_fallback.sqlite",
    driver: sqlite3.Database
  });

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS user_queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT,
      question TEXT NOT NULL,
      answer TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      source TEXT DEFAULT 'frontend',
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
    questions_count INTEGER DEFAULT 0,
    answers_count INTEGER DEFAULT 0,
    reputation INTEGER DEFAULT 0,
    role TEXT DEFAULT 'user',
    is_suspended INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migrate existing user tables if they lack the new columns
try {
  await sqliteDb.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
} catch (e) {
  // Column already exists
}
try {
  await sqliteDb.exec("ALTER TABLE users ADD COLUMN is_suspended INTEGER DEFAULT 0");
} catch (e) {
  // Column already exists
}

// Create documents & document chunks tables
await sqliteDb.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mongo_id TEXT,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    filetype TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    chunk_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

await sqliteDb.exec(`
  CREATE TABLE IF NOT EXISTS document_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER,
    content TEXT NOT NULL,
    chunk_index INTEGER,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
  );
`);

// Seed default admin credentials in SQLite
try {
  const adminUser = await sqliteDb.get("SELECT * FROM users WHERE email = 'admin@crowdfaq.com'");
  if (!adminUser) {
    const bcrypt = require("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("adminpassword", salt);
    await sqliteDb.run(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      "Admin",
      "admin@crowdfaq.com",
      hash,
      "admin"
    );
    console.log("Seeded SQLite default admin user.");
  } else if (adminUser.role !== "admin") {
    await sqliteDb.run("UPDATE users SET role = 'admin' WHERE email = 'admin@crowdfaq.com'");
    console.log("Updated existing default admin user role to admin in SQLite.");
  }
} catch (adminErr) {
  console.error("Failed to seed SQLite default admin user:", adminErr.message);
}


await sqliteDb.exec(`
  CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mongo_id TEXT,
    question_id TEXT,
    query_id TEXT,
    content TEXT NOT NULL,
    author TEXT DEFAULT 'Community Member',
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

  console.log("SQLite fallback ready");
}

function getSQLiteDb() {
  if (!sqliteDb) {
    throw new Error("SQLite database not initialized");
  }

  return sqliteDb;
}

module.exports = {
  connectSQLite,
  getSQLiteDb
};
