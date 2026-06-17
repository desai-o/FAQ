const express = require("express");
const router = express.Router();

const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const Vote = require("../models/Vote");
const { trackEvent } = require("../services/eventService");
const { requireAuth } = require("../middleware/auth");
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      targetType,
      targetId,
      value = 1
    } = req.body;

    const userId = req.user.id;

    if (!targetType || !targetId) {
      return res.status(400).json({
        error: "targetType and targetId are required"
      });
    }

    if (!["question", "answer"].includes(targetType)) {
      return res.status(400).json({
        error: "targetType must be question or answer"
      });
    }

    if (isMongoAvailable()) {
      const existing = await Vote.findOne({ userId, targetType, targetId });

      if (existing) {
        await Vote.deleteOne({ _id: existing._id });

        await trackEvent({
          type: "vote_removed",
          userId,
          targetType,
          targetId,
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

      const vote = await Vote.create({
        userId,
        targetType,
        targetId,
        value
      });

      await trackEvent({
        type: "vote_created",
        userId,
        targetType,
        targetId,
        metadata: {
          storage: "mongodb",
          value
        }
      });

      return res.status(201).json({
        status: "success",
        storage: "mongodb",
        action: "created",
        data: vote
      });
    }

    const db = getSQLiteDb();

    const existing = await db.get(
      `
      SELECT *
      FROM votes
      WHERE user_id = ?
        AND target_type = ?
        AND target_id = ?
      `,
      userId,
      targetType,
      targetId
    );

    if (existing) {
      await db.run(
        `
        DELETE FROM votes
        WHERE id = ?
        `,
        existing.id
      );

      await trackEvent({
        type: "vote_removed",
        userId,
        targetType,
        targetId,
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
      INSERT INTO votes (
        user_id,
        target_type,
        target_id,
        value,
        synced_to_mongo
      )
      VALUES (?, ?, ?, ?, 0)
      `,
      userId,
      targetType,
      targetId,
      value
    );

    await trackEvent({
      type: "vote_created",
      userId,
      targetType,
      targetId,
      metadata: {
        storage: "sqlite",
        value
      }
    });

    return res.status(201).json({
      status: "success",
      storage: "sqlite",
      action: "created",
      data: {
        id: result.lastID,
        userId,
        targetType,
        targetId,
        value
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to process vote",
      details: error.message
    });
  }
});

module.exports = router;
