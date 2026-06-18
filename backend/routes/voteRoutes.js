const express = require("express");
const router = express.Router();
const { z } = require("zod");
const { validate } = require("../middleware/validate");

const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const Vote = require("../models/Vote");
const Answer = require("../models/Answer");
const FAQ = require("../models/FAQ");
const { trackEvent } = require("../services/eventService");
const { requireAuth } = require("../middleware/auth");
const { success, fail } = require("../utils/apiResponse");
const { writeLimiter } = require("../middleware/rateLimits");

const voteSchema = z.object({
  body: z.object({
    targetType: z.enum(["question", "answer"]),
    targetId: z.string().trim().min(1).max(100),
    value: z.union([z.literal(1), z.literal(-1)]).optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

router.post("/", requireAuth, writeLimiter, validate(voteSchema), async (req, res) => {
  try {
    const {
      targetType,
      targetId,
      value = 1
    } = req.body;

    const userId = req.user.id;

    if (!targetType || !targetId) {
      return fail(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "targetType and targetId are required"
      });
    }

    if (!["question", "answer"].includes(targetType)) {
      return fail(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "targetType must be question or answer"
      });
    }

    if (isMongoAvailable()) {
      const existing = await Vote.findOne({ userId, targetType, targetId });

      if (existing) {
        await Vote.deleteOne({ _id: existing._id });

        if (targetType === "answer") {
          await Answer.findByIdAndUpdate(targetId, { $inc: { votes: -existing.value } });
        }

        await trackEvent({
          type: "vote_removed",
          userId,
          targetType,
          targetId,
          metadata: {
            storage: "mongodb"
          }
        });

        return success(res, {
          storage: "mongodb",
          data: existing,
          meta: { action: "removed" }
        });
      }

      const vote = await Vote.create({
        userId,
        targetType,
        targetId,
        value
      });

      if (targetType === "answer") {
        await Answer.findByIdAndUpdate(targetId, { $inc: { votes: value } });
      }

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

      return success(res, {
        statusCode: 201,
        storage: "mongodb",
        data: vote,
        meta: { action: "created" }
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

      if (targetType === "answer") {
        await db.run(
          `
          UPDATE answers
          SET votes = COALESCE(votes, 0) - ?
          WHERE id = ?
          `,
          existing.value,
          targetId
        );
      }

      await trackEvent({
        type: "vote_removed",
        userId,
        targetType,
        targetId,
        metadata: {
          storage: "sqlite"
        }
      });

      return success(res, {
        storage: "sqlite",
        data: existing,
        meta: { action: "removed" }
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

    if (targetType === "answer") {
      await db.run(
        `
        UPDATE answers
        SET votes = COALESCE(votes, 0) + ?
        WHERE id = ?
        `,
        value,
        targetId
      );
    }

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

    return success(res, {
      statusCode: 201,
      storage: "sqlite",
      data: {
        id: result.lastID,
        userId,
        targetType,
        targetId,
        value
      },
      meta: { action: "created" }
    });
  } catch (error) {
    return fail(res, {
      statusCode: 500,
      code: "VOTE_PROCESSING_FAILED",
      message: "Failed to process vote",
      details: error.message
    });
  }
});

module.exports = router;
