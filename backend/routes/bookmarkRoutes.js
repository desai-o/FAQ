const express = require("express");
const router = express.Router();

const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const Bookmark = require("../models/Bookmark");
const { trackEvent } = require("../services/eventService");
const { requireAuth } = require("../middleware/auth");
router.post("/", requireAuth, async (req, res) => {
  try {
    const { questionId } = req.body;
    const userId = req.user.id;

    if (!questionId) {
      return res.status(400).json({
        error: "questionId is required"
      });
    }

    if (isMongoAvailable()) {
      const existing = await Bookmark.findOne({ userId, questionId });

      if (existing) {
        await Bookmark.deleteOne({ _id: existing._id });

        await trackEvent({
          type: "bookmark_removed",
          userId,
          targetType: "question",
          targetId: questionId,
          metadata: {
            storage: "mongodb"
          }
        });

        return res.json({
          status: "success",
          storage: "mongodb",
          action: "removed",
          data: existing
        });
      }

      const bookmark = await Bookmark.create({ userId, questionId });

      await trackEvent({
        type: "bookmark_created",
        userId,
        targetType: "question",
        targetId: questionId,
        metadata: {
          storage: "mongodb"
        }
      });

      return res.status(201).json({
        status: "success",
        storage: "mongodb",
        action: "created",
        data: bookmark
      });
    }

    const db = getSQLiteDb();

    const existing = await db.get(
      `
      SELECT *
      FROM bookmarks
      WHERE user_id = ?
        AND question_id = ?
      `,
      userId,
      questionId
    );

    if (existing) {
      await db.run(
        `
        DELETE FROM bookmarks
        WHERE id = ?
        `,
        existing.id
      );

      await trackEvent({
        type: "bookmark_removed",
        userId,
        targetType: "question",
        targetId: questionId,
        metadata: {
          storage: "sqlite"
        }
      });

      return res.json({
        status: "success",
        storage: "sqlite",
        action: "removed",
        data: existing
      });
    }

    const result = await db.run(
      `
      INSERT INTO bookmarks (
        user_id,
        question_id,
        synced_to_mongo
      )
      VALUES (?, ?, 0)
      `,
      userId,
      questionId
    );

    await trackEvent({
      type: "bookmark_created",
      userId,
      targetType: "question",
      targetId: questionId,
      metadata: {
        storage: "sqlite"
      }
    });

    return res.status(201).json({
      status: "success",
      storage: "sqlite",
      action: "created",
      data: {
        id: result.lastID,
        userId,
        questionId
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to process bookmark",
      details: error.message
    });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    if (isMongoAvailable()) {
      const bookmarks = await Bookmark.find({ userId });

      return res.json({
        status: "success",
        storage: "mongodb",
        data: bookmarks
      });
    }

    const db = getSQLiteDb();

    const bookmarks = await db.all(
      `
      SELECT *
      FROM bookmarks
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      userId
    );

    return res.json({
      status: "success",
      storage: "sqlite",
      data: bookmarks
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch bookmarks",
      details: error.message
    });
  }
});

module.exports = router;
