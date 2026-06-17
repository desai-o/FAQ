const express = require("express");
const router = express.Router();
const { getSQLiteDb } = require("../db/sqlite");
const { requireAuth } = require("../middleware/auth");

router.post("/", requireAuth, async (req, res) => {
  try {
    const { followable_type, followable_id } = req.body;
    const user_id = req.user.id;

    if (!followable_type || !followable_id) {
      return res.status(400).json({ error: "followable_type and followable_id are required" });
    }

    if (!['question', 'tag'].includes(followable_type)) {
      return res.status(400).json({ error: "followable_type must be 'question' or 'tag'" });
    }

    const db = getSQLiteDb();
    
    // Check if already follows
    const existing = await db.get(
      `SELECT id FROM follows WHERE user_id = ? AND followable_type = ? AND followable_id = ?`,
      user_id, followable_type, followable_id
    );

    if (existing) {
      return res.status(409).json({ error: "Already following" });
    }

    const result = await db.run(
      `INSERT INTO follows (user_id, followable_type, followable_id) VALUES (?, ?, ?)`,
      user_id, followable_type, followable_id
    );

    res.status(201).json({ 
      id: result.lastID, 
      user_id, 
      followable_type, 
      followable_id, 
      is_muted: false 
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create follow", details: error.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
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
      return res.status(404).json({ error: "Follow record not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to unfollow", details: error.message });
  }
});

router.patch("/:id/mute", requireAuth, async (req, res) => {
  try {
    const { is_muted } = req.body;
    const db = getSQLiteDb();
    
    const result = await db.run(
      `
      UPDATE follows
      SET is_muted = ?
      WHERE id = ?
        AND user_id = ?
      `,
      is_muted ? 1 : 0,
      req.params.id,
      req.user.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Follow record not found" });
    }

    res.json({ success: true, id: req.params.id, is_muted: !!is_muted });
  } catch (error) {
    res.status(500).json({ error: "Failed to mute follow", details: error.message });
  }
});

module.exports = router;
