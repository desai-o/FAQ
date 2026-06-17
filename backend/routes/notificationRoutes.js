const express = require("express");
const router = express.Router();

const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const Notification = require("../models/Notification");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    if (isMongoAvailable()) {
      const notifications = await Notification.find({
        userId
      }).sort({
        createdAt: -1
      });

      return res.json({
        status: "success",
        storage: "mongodb",
        data: notifications
      });
    }

    const db = getSQLiteDb();

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

    const notifications = await db.all(
      `
      SELECT *
      FROM notifications
      WHERE user_id IN (${placeholders})
      ORDER BY created_at DESC
      `,
      ...userIdMatch
    );

    return res.json({
      status: "success",
      storage: "sqlite",
      data: notifications.map((item) => ({
        ...item,
        is_read: Boolean(item.is_read)
      }))
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      code: "NOTIFICATIONS_FETCH_FAILED",
      message: "Failed to fetch notifications",
      details: error.message
    });
  }
});

router.patch("/read", requireAuth, async (req, res) => {
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

      return res.json({
        status: "success",
        storage: "mongodb",
        data: {
          updated: true
        }
      });
    }

    const db = getSQLiteDb();

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

    return res.json({
      status: "success",
      storage: "sqlite",
      data: {
        updated: true
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      code: "NOTIFICATIONS_MARK_READ_FAILED",
      message: "Failed to mark notifications as read",
      details: error.message
    });
  }
});

module.exports = router;
