const { isMongoAvailable } = require("../db/mongo");
const { enqueueJob } = require("./queueService");
const { getSQLiteDb } = require("../db/sqlite");
const UserQuery = require("../models/UserQuery");
const FAQ = require("../models/FAQ");
const User = require("../models/User");
const Answer = require("../models/Answer");
const Vote = require("../models/Vote");
const Bookmark = require("../models/Bookmark");
const Event = require("../models/Event");

let syncInProgress = false;

function extractKeywords(text) {
  if (!text) return [];

  const stopWords = new Set([
    "the",
    "is",
    "are",
    "a",
    "an",
    "to",
    "of",
    "for",
    "in",
    "on",
    "and",
    "or",
    "with",
    "how",
    "what",
    "when",
    "where",
    "why",
    "do",
    "does",
    "can",
    "i",
    "we",
    "you"
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .slice(0, 12);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function promoteMongoResolvedQueries() {
  const resolvedQueries = await UserQuery.find({
    status: "resolved",
    promoted: false,
    answer: { $ne: "" }
  });

  for (const query of resolvedQueries) {
    const existingFaq = await FAQ.findOne({
      question: new RegExp(`^${escapeRegex(query.question)}$`, "i")
    });

    if (!existingFaq) {
      await FAQ.create({
        question: query.question,
        answer: query.answer,
        keywords: extractKeywords(`${query.question} ${query.answer}`),
        sourceQueryId: query._id,
        category: query.category || "General",
        tags: query.tags || [],
        userId: query.userId || "anonymous",
        authorName: query.authorName || "Anonymous"
      });
    }

    query.promoted = true;
    await query.save();
  }
}

async function promoteSQLiteResolvedQueries() {
  const db = getSQLiteDb();

  const resolvedRows = await db.all(`
    SELECT *
    FROM user_queries
    WHERE status = 'resolved'
      AND promoted = 0
      AND answer IS NOT NULL
      AND answer != ''
  `);

  for (const row of resolvedRows) {
    const existingFaq = await db.get(
      `
      SELECT *
      FROM faqs
      WHERE LOWER(question) = LOWER(?)
      `,
      row.question
    );

    if (!existingFaq) {
      const keywords = extractKeywords(`${row.question} ${row.answer}`).join(",");

      await db.run(
        `
        INSERT INTO faqs (
          question,
          answer,
          keywords,
          category,
          tags,
          user_id,
          author_name,
          source_query_id,
          synced_to_mongo
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
        `,
        row.question,
        row.answer,
        keywords,
        row.category || "General",
        row.tags || "",
        row.user_id || "anonymous",
        row.author_name || "Anonymous",
        String(row.id)
      );
    }

    await db.run(
      `
      UPDATE user_queries
      SET promoted = 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      row.id
    );
  }
}

async function syncSQLiteAnswersToMongo(db) {
  const rows = await db.all(`
    SELECT *
    FROM answers
    WHERE synced_to_mongo = 0
  `);

  for (const row of rows) {
    try {
      const answer = await Answer.create({
        questionId: row.question_id || null,
        queryId: row.query_id || null,
        content: row.content,
        author: row.author || row.author_name || "Community Member",
        userId: row.user_id || "anonymous",
        authorName: row.author_name || row.author || "Community Member",
        votes: row.votes || 0,
        isBest: Boolean(row.is_best)
      });

      await db.run(
        `
        UPDATE answers
        SET synced_to_mongo = 1,
            mongo_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        String(answer._id),
        row.id
      );
    } catch (error) {
      console.error(`Answer sync failed for SQLite answer ${row.id}:`, error.message);
    }
  }
}

async function syncSQLiteVotesToMongo(db) {
  const rows = await db.all(`
    SELECT *
    FROM votes
    WHERE synced_to_mongo = 0
  `);

  for (const row of rows) {
    try {
      const existing = await Vote.findOne({
        userId: row.user_id,
        targetType: row.target_type,
        targetId: row.target_id
      });

      let vote = existing;

      if (!existing) {
        vote = await Vote.create({
          userId: row.user_id,
          targetType: row.target_type,
          targetId: row.target_id,
          value: row.value || 1
        });
      }

      await db.run(
        `
        UPDATE votes
        SET synced_to_mongo = 1,
            mongo_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        String(vote._id),
        row.id
      );
    } catch (error) {
      console.error(`Vote sync failed for SQLite vote ${row.id}:`, error.message);
    }
  }
}

async function syncSQLiteBookmarksToMongo(db) {
  const rows = await db.all(`
    SELECT *
    FROM bookmarks
    WHERE synced_to_mongo = 0
  `);

  for (const row of rows) {
    try {
      const existing = await Bookmark.findOne({
        userId: row.user_id,
        questionId: row.question_id
      });

      let bookmark = existing;

      if (!existing) {
        bookmark = await Bookmark.create({
          userId: row.user_id,
          questionId: row.question_id
        });
      }

      await db.run(
        `
        UPDATE bookmarks
        SET synced_to_mongo = 1,
            mongo_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        String(bookmark._id),
        row.id
      );
    } catch (error) {
      console.error(`Bookmark sync failed for SQLite bookmark ${row.id}:`, error.message);
    }
  }
}

async function syncSQLiteEventsToMongo(db) {
  const rows = await db.all(`
    SELECT *
    FROM events
    WHERE synced_to_mongo = 0
  `);

  for (const row of rows) {
    try {
      let metadata = {};

      try {
        metadata = row.metadata ? JSON.parse(row.metadata) : {};
      } catch {
        metadata = {};
      }

      const event = await Event.create({
        type: row.type,
        userId: row.user_id || "anonymous",
        targetType: row.target_type || "",
        targetId: row.target_id || "",
        metadata
      });

      await db.run(
        `
        UPDATE events
        SET synced_to_mongo = 1,
            mongo_id = ?
        WHERE id = ?
        `,
        String(event._id),
        row.id
      );
    } catch (error) {
      console.error(`Event sync failed for SQLite event ${row.id}:`, error.message);
    }
  }
}

async function syncSQLiteToMongo() {
  if (!isMongoAvailable()) return;

  const db = getSQLiteDb();

  // Sync users first so queries can associate correctly if needed
  const unsyncedUsers = await db.all(`
    SELECT *
    FROM users
    WHERE mongo_id IS NULL OR mongo_id = ''
  `);

  for (const row of unsyncedUsers) {
    try {
      const existingUser = await User.findOne({ email: row.email });
      let mongoUser = existingUser;

      if (!existingUser) {
        mongoUser = await User.create({
          name: row.name,
          email: row.email,
          passwordHash: row.password_hash,
          role: row.role || "student",
          badges: row.badges ? row.badges.split(",").filter(Boolean) : [],
          cohort: row.cohort || "",
          questionsCount: row.questions_count,
          answersCount: row.answers_count,
          reputation: row.reputation
        });
      }

      await db.run(
        `
        UPDATE users
        SET mongo_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        String(mongoUser._id),
        row.id
      );
    } catch (syncErr) {
      console.error(`User sync failed for email ${row.email}:`, syncErr.message);
    }
  }

  const unsyncedQueries = await db.all(`
    SELECT *
    FROM user_queries
    WHERE synced_to_mongo = 0
  `);

  for (const row of unsyncedQueries) {
    try {
      const existingQuery = await UserQuery.findOne({
        question: new RegExp(`^${escapeRegex(row.question)}$`, "i")
      });

      let mongoQuery = existingQuery;

      if (!existingQuery) {
        mongoQuery = await UserQuery.create({
          question: row.question,
          answer: row.answer || "",
          status: row.status,
          source: row.source || "sqlite-fallback",
          promoted: Boolean(row.promoted),
          description: row.description || "",
          category: row.category || "General",
          tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
          userId: row.user_id || "anonymous",
          authorName: row.author_name || "Anonymous"
        });
      }

      await db.run(
        `
        UPDATE user_queries
        SET synced_to_mongo = 1,
            mongo_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        String(mongoQuery._id),
        row.id
      );
    } catch (querySyncErr) {
      console.error(`Query sync failed for SQLite query ${row.id}:`, querySyncErr.message);
    }
  }

  const unsyncedFaqs = await db.all(`
    SELECT *
    FROM faqs
    WHERE synced_to_mongo = 0
  `);

  for (const row of unsyncedFaqs) {
    try {
      const existingFaq = await FAQ.findOne({
        question: new RegExp(`^${escapeRegex(row.question)}$`, "i")
      });

      let mongoFaq = existingFaq;

      if (!existingFaq) {
        mongoFaq = await FAQ.create({
          question: row.question,
          answer: row.answer,
          keywords: row.keywords ? row.keywords.split(",") : [],
          sourceQueryId: null,
          category: row.category || "General",
          tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
          searchBoost: row.search_boost || 1,
          userId: row.user_id || "anonymous",
          authorName: row.author_name || "Anonymous"
        });
      }

      await db.run(
        `
        UPDATE faqs
        SET synced_to_mongo = 1,
            mongo_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        String(mongoFaq._id),
        row.id
      );
    } catch (faqSyncErr) {
      console.error(`FAQ sync failed for SQLite FAQ ${row.id}:`, faqSyncErr.message);
    }
  }

  await syncSQLiteAnswersToMongo(db);
  await syncSQLiteVotesToMongo(db);
  await syncSQLiteBookmarksToMongo(db);
  await syncSQLiteEventsToMongo(db);
}

async function runSyncPipeline() {
  if (syncInProgress) {
    return;
  }

  syncInProgress = true;

  try {
    await promoteSQLiteResolvedQueries();

    if (isMongoAvailable()) {
      await promoteMongoResolvedQueries();
      await syncSQLiteToMongo();
      await promoteMongoResolvedQueries();
    }
  } catch (error) {
    console.error("Sync pipeline error:", error.message);
  } finally {
    syncInProgress = false;
  }
}

function startSyncPipeline() {
  const interval = Number(process.env.SYNC_INTERVAL_MS || 30000);

  setInterval(runSyncPipeline, interval);

  console.log(`Sync pipeline started. Interval: ${interval}ms`);
}

function enqueueSyncPipeline() {
  enqueueJob({
    type: "sync",
    handler: runSyncPipeline
  });
}

module.exports = {
  runSyncPipeline,
  enqueueSyncPipeline,
  startSyncPipeline,
  extractKeywords
};
