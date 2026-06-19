const express = require("express");
const router = express.Router();
const { z } = require("zod");
const { validate } = require("../middleware/validate");

const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const Follow = require("../models/Follow");
const { requireAuth } = require("../middleware/auth");
const { success, fail } = require("../utils/apiResponse");
const { writeLimiter } = require("../middleware/rateLimits");

const followSchema = z.object({
  body: z.object({
    followableType: z.enum(["question", "tag"]),
    followableId: z.string().trim().min(1).max(100)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

router.post("/", requireAuth, writeLimiter, validate(followSchema), async (req, res) => {
  try {
    const { followableType, followableId } = req.body;
    const userId = req.user.id;

    if (!followableType || !followableId) {
      return fail(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "followableType and followableId are required"
      });
    }

    if (!["question", "tag"].includes(followableType)) {
      return fail(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "followableType must be question or tag"
      });
    }

    if (isMongoAvailable()) {
      const existing = await Follow.findOne({
        userId,
        followableType,
        followableId: String(followableId)
      });

      if (existing) {
        return fail(res, {
          statusCode: 409,
          code: "ALREADY_FOLLOWING",
          message: "Already following"
        });
      }

      const follow = await Follow.create({
        userId,
        followableType,
        followableId: String(followableId)
      });

      return success(res, {
        statusCode: 201,
        storage: "mongodb",
        data: follow
      });
    }

    const db = getSQLiteDb();

    const existing = await db.get(
      `
      SELECT *
      FROM follows
      WHERE user_id = ?
        AND followable_type = ?
        AND followable_id = ?
      `,
      userId,
      followableType,
      String(followableId)
    );

    if (existing) {
      return fail(res, {
        statusCode: 409,
        code: "ALREADY_FOLLOWING",
        message: "Already following"
      });
    }

    const result = await db.run(
      `
      INSERT INTO follows (
        user_id,
        followable_type,
        followable_id
      )
      VALUES (?, ?, ?)
      `,
      userId,
      followableType,
      String(followableId)
    );

    return success(res, {
      statusCode: 201,
      storage: "sqlite",
      data: {
        id: result.lastID,
        userId,
        followableType,
        followableId: String(followableId),
        isMuted: false
      }
    });
  } catch (error) {
    return fail(res, {
      statusCode: 500,
      code: "FOLLOW_CREATE_FAILED",
      message: "Failed to create follow",
      details: error.message
    });
  }
});

router.delete("/:id", requireAuth, writeLimiter, async (req, res) => {
  try {
    if (isMongoAvailable()) {
      const result = await Follow.deleteOne({
        _id: req.params.id,
        userId: req.user.id
      });

      if (result.deletedCount === 0) {
        return fail(res, {
          statusCode: 404,
          code: "FOLLOW_NOT_FOUND",
          message: "Follow record not found"
        });
      }

      return success(res, {
        storage: "mongodb",
        data: {
          deleted: true
        }
      });
    }

    const db = getSQLiteDb();

    const result = await db.run(
      `
      DELETE FROM follows
      WHERE id = ?
        AND user_id = ?
      `,
      req.params.id,
      req.user.id
    );

    if (result.changes === 0) {
      return fail(res, {
        statusCode: 404,
        code: "FOLLOW_NOT_FOUND",
        message: "Follow record not found"
      });
    }

    return success(res, {
      storage: "sqlite",
      data: {
        deleted: true
      }
    });
  } catch (error) {
    return fail(res, {
      statusCode: 500,
      code: "FOLLOW_DELETE_FAILED",
      message: "Failed to unfollow",
      details: error.message
    });
  }
});

router.patch("/:id/mute", requireAuth, writeLimiter, async (req, res) => {
  try {
    const { isMuted } = req.body;

    if (isMongoAvailable()) {
      const follow = await Follow.findOneAndUpdate(
        {
          _id: req.params.id,
          userId: req.user.id
        },
        {
          isMuted: Boolean(isMuted)
        },
        {
          new: true
        }
      );

      if (!follow) {
        return fail(res, {
          statusCode: 404,
          code: "FOLLOW_NOT_FOUND",
          message: "Follow record not found"
        });
      }

      return success(res, {
        storage: "mongodb",
        data: follow
      });
    }

    const db = getSQLiteDb();

    const result = await db.run(
      `
      UPDATE follows
      SET is_muted = ?
      WHERE id = ?
        AND user_id = ?
      `,
      isMuted ? 1 : 0,
      req.params.id,
      req.user.id
    );

    if (result.changes === 0) {
      return fail(res, {
        statusCode: 404,
        code: "FOLLOW_NOT_FOUND",
        message: "Follow record not found"
      });
    }

    return success(res, {
      storage: "sqlite",
      data: {
        id: req.params.id,
        isMuted: Boolean(isMuted)
      }
    });
  } catch (error) {
    return fail(res, {
      statusCode: 500,
      code: "FOLLOW_MUTE_FAILED",
      message: "Failed to mute follow",
      details: error.message
    });
  }
});

module.exports = router;
