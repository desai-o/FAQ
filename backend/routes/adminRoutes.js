const express = require("express");
const router = express.Router();

const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const UserQuery = require("../models/UserQuery");
const FAQ = require("../models/FAQ");
const Answer = require("../models/Answer");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");

router.use(requireAuth);
router.use(requireRole("moderator", "admin"));

router.get("/pending-queries", async (req, res) => {
  try {
    if (isMongoAvailable()) {
      const queries = await UserQuery.find({
        status: "pending"
      }).sort({
        createdAt: -1
      });

      return res.json({
        status: "success",
        storage: "mongodb",
        data: queries
      });
    }

    const db = getSQLiteDb();

    const queries = await db.all(`
      SELECT *
      FROM user_queries
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `);

    return res.json({
      status: "success",
      storage: "sqlite",
      data: queries
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      code: "ADMIN_PENDING_QUERIES_FAILED",
      message: "Failed to fetch pending queries",
      details: error.message
    });
  }
});

router.get("/overview", async (req, res) => {
  try {
    if (isMongoAvailable()) {
      const [users, faqs, queries, answers] = await Promise.all([
        User.countDocuments(),
        FAQ.countDocuments(),
        UserQuery.countDocuments(),
        Answer.countDocuments()
      ]);

      return res.json({
        status: "success",
        storage: "mongodb",
        data: {
          users,
          faqs,
          queries,
          answers
        }
      });
    }

    const db = getSQLiteDb();

    const users = await db.get("SELECT COUNT(*) AS count FROM users");
    const faqs = await db.get("SELECT COUNT(*) AS count FROM faqs");
    const queries = await db.get("SELECT COUNT(*) AS count FROM user_queries");
    const answers = await db.get("SELECT COUNT(*) AS count FROM answers");

    return res.json({
      status: "success",
      storage: "sqlite",
      data: {
        users: users.count,
        faqs: faqs.count,
        queries: queries.count,
        answers: answers.count
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      code: "ADMIN_OVERVIEW_FAILED",
      message: "Failed to fetch admin overview",
      details: error.message
    });
  }
});

module.exports = router;
