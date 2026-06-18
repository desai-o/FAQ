const express = require("express");
const router = express.Router();
const { z } = require("zod");
const { validate } = require("../middleware/validate");

const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const Notification = require("../models/Notification");
const { requireAuth } = require("../middleware/auth");
const { getPagination } = require("../utils/pagination");
const { success, fail } = require("../utils/apiResponse");
const { writeLimiter } = require("../middleware/rateLimits");

const getNotificationsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    limit: z.string().optional(),
    offset: z.string().optional()
  }).optional()
});

const markReadSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

function normalizeSqliteNotification(item) {
  return {
    id: String(item.id),
    userId: item.user_id,
    followId: item.follow_id,
    message: item.message,
    eventType: item.event_type || "",
    followableType: item.followable_type || "",
    followableId: item.followable_id || "",
    isRead: Boolean(item.is_read),
    createdAt: item.created_at,
    updatedAt: item.updated_at
  };
}

router.get("/", requireAuth, validate(getNotificationsSchema), async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit, offset } = getPagination(req.query);

    if (isMongoAvailable()) {
      const [notifications, total] = await Promise.all([
        Notification.find({ userId }).sort({ createdAt: -1 }).skip(offset).limit(limit),
        Notification.countDocuments({ userId })
      ]);

      return success(res, {
        storage: "mongodb",
        data: notifications,
        meta: { pagination: { limit, offset, total } }
      });
    }

    const db = getSQLiteDb();
    const notifications = await db.all(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, user_id);
    
    const formatted = notifications.map(n => ({
      ...n,
      is_read: !!n.is_read
    }));

    res.json({ data: formatted });

    const user = await db.get(
      `
      SELECT id, mongo_id
      FROM users
      WHERE id = ?
         OR mongo_id = ?
      `,
      userId,
      userId
    );

    const userIdMatch = user
      ? [String(user.id), user.mongo_id].filter(Boolean)
      : [userId];

    const placeholders = userIdMatch.map(() => "?").join(",");

    const [notifications, totalRow] = await Promise.all([
      db.all(
        `
        SELECT *
        FROM notifications
        WHERE user_id IN (${placeholders})
        ORDER BY created_at DESC
        LIMIT ?
        OFFSET ?
        `,
        ...userIdMatch,
        limit,
        offset
      ),
      db.get(
        `
        SELECT COUNT(*) AS total
        FROM notifications
        WHERE user_id IN (${placeholders})
        `,
        ...userIdMatch
      )
    ]);

    return success(res, {
      storage: "sqlite",
      data: notifications.map(normalizeSqliteNotification),
      meta: { pagination: { limit, offset, total: totalRow.total } }
    });
  } catch (error) {
    return fail(res, {
      statusCode: 500,
      code: "NOTIFICATIONS_FETCH_FAILED",
      message: "Failed to fetch notifications",
      details: error.message
    });
  }
});

router.patch("/:id/read", requireAuth, writeLimiter, async (req, res) => {
  try {
    const userId = req.user.id;

    if (isMongoAvailable()) {
      const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, userId },
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        return fail(res, {
          statusCode: 404,
          code: "NOTIFICATION_NOT_FOUND",
          message: "Notification not found"
        });
      }

      return success(res, {
        storage: "mongodb",
        data: notification
      });
    }

    const db = getSQLiteDb();

    const result = await db.run(
      `
      UPDATE notifications
      SET is_read = 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND user_id = ?
      `,
      req.params.id,
      userId
    );

    if (result.changes === 0) {
      return fail(res, {
        statusCode: 404,
        code: "NOTIFICATION_NOT_FOUND",
        message: "Notification not found"
      });
    }

    return success(res, {
      storage: "sqlite",
      data: { updated: true }
    });
  } catch (error) {
    return fail(res, {
      statusCode: 500,
      code: "NOTIFICATION_MARK_READ_FAILED",
      message: "Failed to mark notification as read",
      details: error.message
    });
  }
});

router.patch("/read", requireAuth, writeLimiter, validate(markReadSchema), async (req, res) => {
  try {
    const userId = req.user.id;

    if (isMongoAvailable()) {
      await Notification.updateMany(
        {
          userId
        },
        {
          isRead: true
        }
      );

      return success(res, {
        storage: "mongodb",
        data: {
          updated: true
        }
      });
    }

    const db = getSQLiteDb();
    await db.run(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ?`, 
      user_id

    const user = await db.get(
      `
      SELECT id, mongo_id
      FROM users
      WHERE id = ?
         OR mongo_id = ?
      `,
      userId,
      userId
    );

    const userIdMatch = user
      ? [String(user.id), user.mongo_id].filter(Boolean)
      : [userId];

    const placeholders = userIdMatch.map(() => "?").join(",");

    await db.run(
      `
      UPDATE notifications
      SET is_read = 1
      WHERE user_id IN (${placeholders})
      `,
      ...userIdMatch
    );

    return success(res, {
      storage: "sqlite",
      data: {
        updated: true
      }
    });
  } catch (error) {
    return fail(res, {
      statusCode: 500,
      code: "NOTIFICATIONS_MARK_READ_FAILED",
      message: "Failed to mark notifications as read",
      details: error.message
    });
  }
});

router.delete("/:id", requireAuth, writeLimiter, async (req, res) => {
  try {
    const userId = req.user.id;

    if (isMongoAvailable()) {
      const result = await Notification.deleteOne({
        _id: req.params.id,
        userId
      });

      if (result.deletedCount === 0) {
        return fail(res, {
          statusCode: 404,
          code: "NOTIFICATION_NOT_FOUND",
          message: "Notification not found"
        });
      }

      return success(res, {
        storage: "mongodb",
        data: { deleted: true }
      });
    }

    const db = getSQLiteDb();

    const result = await db.run(
      `
      DELETE FROM notifications
      WHERE id = ?
        AND user_id = ?
      `,
      req.params.id,
      userId
    );

    if (result.changes === 0) {
      return fail(res, {
        statusCode: 404,
        code: "NOTIFICATION_NOT_FOUND",
        message: "Notification not found"
      });
    }

    return success(res, {
      storage: "sqlite",
      data: { deleted: true }
    });
  } catch (error) {
    return fail(res, {
      statusCode: 500,
      code: "NOTIFICATION_DELETE_FAILED",
      message: "Failed to delete notification",
      details: error.message
    });
  }
});

module.exports = router;
