const express = require("express");
const router = express.Router();

const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const Event = require("../models/Event");

function getStartDate(range) {
  const now = new Date();

  if (range === "month") {
    now.setDate(now.getDate() - 30);
  } else if (range === "year") {
    now.setDate(now.getDate() - 365);
  } else {
    now.setDate(now.getDate() - 7);
  }

  return now;
}

function getDayLabel(date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short"
  });
}

router.get("/activity", async (req, res) => {
  try {
    const range = req.query.range || "week";
    const startDate = getStartDate(range);

    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    if (isMongoAvailable()) {
      const events = await Event.find({
        createdAt: {
          $gte: startDate
        }
      });

      const questions = Array(7).fill(0);
      const answers = Array(7).fill(0);
      const upvotes = Array(7).fill(0);

      for (const event of events) {
        const day = getDayLabel(event.createdAt);
        const index = labels.indexOf(day);

        if (index === -1) continue;

        if (event.type === "question_created") questions[index] += 1;
        if (event.type === "answer_created") answers[index] += 1;
        if (event.type === "vote_created") upvotes[index] += 1;
      }

      return res.json({
        status: "success",
        storage: "mongodb",
        labels,
        questions,
        answers,
        upvotes,
        meta: {
          range,
          totalEvents: events.length
        }
      });
    }

    const db = getSQLiteDb();

    const rows = await db.all(
      `
      SELECT *
      FROM events
      WHERE datetime(created_at) >= datetime(?)
      `,
      startDate.toISOString()
    );

    const questions = Array(7).fill(0);
    const answers = Array(7).fill(0);
    const upvotes = Array(7).fill(0);

    for (const row of rows) {
      const day = getDayLabel(row.created_at);
      const index = labels.indexOf(day);

      if (index === -1) continue;

      if (row.type === "question_created") questions[index] += 1;
      if (row.type === "answer_created") answers[index] += 1;
      if (row.type === "vote_created") upvotes[index] += 1;
    }

    return res.json({
      status: "success",
      storage: "sqlite",
      labels,
      questions,
      answers,
      upvotes,
      meta: {
        range,
        totalEvents: rows.length
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to generate activity stats",
      details: error.message
    });
  }
});

router.get("/heatmap", async (req, res) => {
  try {
    const range = req.query.range || "week";
    const startDate = getStartDate(range);

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const slots = ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM"];

    function getSlot(dateInput) {
      const hour = new Date(dateInput).getHours();

      if (hour < 4) return "12 AM";
      if (hour < 8) return "4 AM";
      if (hour < 12) return "8 AM";
      if (hour < 16) return "12 PM";
      if (hour < 20) return "4 PM";
      return "8 PM";
    }

    const map = {};

    for (const day of days) {
      for (const slot of slots) {
        map[`${day}-${slot}`] = {
          day,
          time: slot,
          questions: 0,
          answers: 0,
          votes: 0,
          interactions: 0
        };
      }
    }

    let events = [];

    if (isMongoAvailable()) {
      events = await Event.find({
        createdAt: {
          $gte: startDate
        }
      });

      for (const event of events) {
        const day = getDayLabel(event.createdAt);
        const slot = getSlot(event.createdAt);
        const key = `${day}-${slot}`;

        if (!map[key]) continue;

        if (event.type === "question_created") map[key].questions += 1;
        if (event.type === "answer_created") map[key].answers += 1;
        if (event.type === "vote_created") map[key].votes += 1;

        map[key].interactions += 1;
      }

      return res.json({
        status: "success",
        storage: "mongodb",
        data: Object.values(map),
        meta: {
          range,
          totalEvents: events.length
        }
      });
    }

    const db = getSQLiteDb();

    events = await db.all(
      `
      SELECT *
      FROM events
      WHERE datetime(created_at) >= datetime(?)
      `,
      startDate.toISOString()
    );

    for (const event of events) {
      const day = getDayLabel(event.created_at);
      const slot = getSlot(event.created_at);
      const key = `${day}-${slot}`;

      if (!map[key]) continue;

      if (event.type === "question_created") map[key].questions += 1;
      if (event.type === "answer_created") map[key].answers += 1;
      if (event.type === "vote_created") map[key].votes += 1;

      map[key].interactions += 1;
    }

    return res.json({
      status: "success",
      storage: "sqlite",
      data: Object.values(map),
      meta: {
        range,
        totalEvents: events.length
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to generate heatmap stats",
      details: error.message
    });
  }
});

const { requireAuth } = require("../middleware/auth");
const FAQ = require("../models/FAQ");
const Bookmark = require("../models/Bookmark");
const Answer = require("../models/Answer");

router.get("/journey", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    if (isMongoAvailable()) {
      const viewEvents = await Event.find({ userId, type: "faq_viewed" }).lean();
      const viewedFaqIds = Array.from(new Set(viewEvents.map((e) => e.targetId)));

      const bookmarkedCount = await Bookmark.countDocuments({ userId });
      const answeredCount = await Answer.countDocuments({ userId });

      const viewedFaqs = await FAQ.find({ _id: { $in: viewedFaqIds } }).lean();
      
      const topicCoverage = {};
      viewedFaqs.forEach((faq) => {
        topicCoverage[faq.category] = (topicCoverage[faq.category] || 0) + 1;
      });

      return res.json({
        status: "success",
        storage: "mongodb",
        data: {
          viewedCount: viewedFaqIds.length,
          bookmarkedCount,
          answeredCount,
          topicCoverage
        }
      });
    }

    const db = getSQLiteDb();

    const viewRows = await db.all("SELECT DISTINCT target_id FROM events WHERE user_id = ? AND type = 'faq_viewed'", userId);
    const viewedFaqIds = viewRows.map((r) => r.target_id);

    const bookmarkRow = await db.get("SELECT COUNT(*) AS total FROM bookmarks WHERE user_id = ?", userId);
    const bookmarkedCount = bookmarkRow ? bookmarkRow.total : 0;

    const answerRow = await db.get("SELECT COUNT(*) AS total FROM answers WHERE user_id = ?", userId);
    const answeredCount = answerRow ? answerRow.total : 0;

    const topicCoverage = {};
    if (viewedFaqIds.length > 0) {
      const placeholders = viewedFaqIds.map(() => "?").join(",");
      const viewedFaqs = await db.all(
        `SELECT category FROM faqs WHERE id IN (${placeholders}) OR mongo_id IN (${placeholders})`,
        ...viewedFaqIds,
        ...viewedFaqIds
      );
      viewedFaqs.forEach((faq) => {
        if (faq.category) {
          topicCoverage[faq.category] = (topicCoverage[faq.category] || 0) + 1;
        }
      });
    }

    return res.json({
      status: "success",
      storage: "sqlite",
      data: {
        viewedCount: viewedFaqIds.length,
        bookmarkedCount,
        answeredCount,
        topicCoverage
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to generate learning journey stats",
      details: error.message
    });
  }
});

module.exports = router;
