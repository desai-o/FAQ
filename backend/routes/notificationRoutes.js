const express = require("express");
const router = express.Router();
const { getSQLiteDb } = require("../db/sqlite");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, async (req, res) => {
  try {
    const user_id = req.user.id;

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
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications", details: error.message });
  }
});

router.patch("/read", requireAuth, async (req, res) => {
  try {
    const user_id = req.user.id;

    const db = getSQLiteDb();
    await db.run(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ?`, 
      user_id
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notifications as read", details: error.message });
  }
});

module.exports = router;
