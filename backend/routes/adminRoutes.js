const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");

const User = require("../models/User");
const FAQ = require("../models/FAQ");
const UserQuery = require("../models/UserQuery");
const Document = require("../models/Document");
const authenticateAdmin = require("../middleware/adminAuth");

// Apply admin authentication to all routes below
router.use(authenticateAdmin);

// ==========================================
// 1. USER MANAGEMENT
// ==========================================

// Get all users
router.get("/users", async (req, res) => {
  try {
    if (isMongoAvailable()) {
      const users = await User.find().select("-password");
      return res.json({
        storage: "mongodb",
        data: users.map(u => ({
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          role: u.role || "user",
          isSuspended: u.isSuspended || false,
          questionsCount: u.questionsCount || 0,
          answersCount: u.answersCount || 0,
          reputation: u.reputation || 0,
          createdAt: u.createdAt
        }))
      });
    }

    const db = getSQLiteDb();
    const users = await db.all("SELECT * FROM users ORDER BY created_at DESC");
    res.json({
      storage: "sqlite",
      data: users.map(u => ({
        id: u.mongo_id || u.id.toString(),
        sqliteId: u.id,
        name: u.name,
        email: u.email,
        role: u.role || "user",
        isSuspended: Boolean(u.is_suspended),
        questionsCount: u.questions_count || 0,
        answersCount: u.answers_count || 0,
        reputation: u.reputation || 0,
        createdAt: u.created_at
      }))
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users", details: err.message });
  }
});

// Update user details
router.patch("/users/:id", async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const targetId = req.params.id;

    if (isMongoAvailable()) {
      const updatedUser = await User.findByIdAndUpdate(
        targetId,
        { name, email: email.toLowerCase().trim(), role },
        { new: true }
      );
      if (!updatedUser) return res.status(404).json({ error: "User not found" });

      // Sync to SQLite
      try {
        const db = getSQLiteDb();
        await db.run(
          "UPDATE users SET name = ?, email = ?, role = ? WHERE mongo_id = ?",
          name, email.toLowerCase().trim(), role, targetId
        );
      } catch (e) {}

      return res.json({ success: true, data: updatedUser });
    }

    const db = getSQLiteDb();
    const result = await db.run(
      "UPDATE users SET name = ?, email = ?, role = ? WHERE mongo_id = ? OR id = ?",
      name, email.toLowerCase().trim(), role, targetId, targetId
    );

    if (result.changes === 0) return res.status(404).json({ error: "User not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user", details: err.message });
  }
});

// Toggle suspend user
router.post("/users/:id/suspend", async (req, res) => {
  try {
    const targetId = req.params.id;

    // Prevent suspending oneself
    if (targetId === req.user.id) {
      return res.status(400).json({ error: "You cannot suspend your own admin account." });
    }

    if (isMongoAvailable()) {
      const user = await User.findById(targetId);
      if (!user) return res.status(404).json({ error: "User not found" });

      user.isSuspended = !user.isSuspended;
      await user.save();

      // Sync to SQLite
      try {
        const db = getSQLiteDb();
        await db.run(
          "UPDATE users SET is_suspended = ? WHERE mongo_id = ?",
          user.isSuspended ? 1 : 0, targetId
        );
      } catch (e) {}

      return res.json({ success: true, isSuspended: user.isSuspended });
    }

    const db = getSQLiteDb();
    const user = await db.get("SELECT * FROM users WHERE mongo_id = ? OR id = ?", targetId, targetId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const newSuspendedVal = user.is_suspended ? 0 : 1;
    await db.run(
      "UPDATE users SET is_suspended = ? WHERE mongo_id = ? OR id = ?",
      newSuspendedVal, targetId, targetId
    );

    res.json({ success: true, isSuspended: Boolean(newSuspendedVal) });
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle suspension", details: err.message });
  }
});

// Delete user
router.delete("/users/:id", async (req, res) => {
  try {
    const targetId = req.params.id;

    if (targetId === req.user.id) {
      return res.status(400).json({ error: "You cannot delete your own admin account." });
    }

    if (isMongoAvailable()) {
      const deletedUser = await User.findByIdAndDelete(targetId);
      if (!deletedUser) return res.status(404).json({ error: "User not found" });

      // Sync to SQLite
      try {
        const db = getSQLiteDb();
        await db.run("DELETE FROM users WHERE mongo_id = ?", targetId);
      } catch (e) {}

      return res.json({ success: true });
    }

    const db = getSQLiteDb();
    const result = await db.run("DELETE FROM users WHERE mongo_id = ? OR id = ?", targetId, targetId);
    if (result.changes === 0) return res.status(404).json({ error: "User not found" });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user", details: err.message });
  }
});

// Reset password
router.post("/users/:id/reset-password", async (req, res) => {
  try {
    const { password } = req.body;
    const targetId = req.params.id;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    if (isMongoAvailable()) {
      const user = await User.findByIdAndUpdate(targetId, { password: hash });
      if (!user) return res.status(404).json({ error: "User not found" });

      // Sync to SQLite
      try {
        const db = getSQLiteDb();
        await db.run("UPDATE users SET password_hash = ? WHERE mongo_id = ?", hash, targetId);
      } catch (e) {}

      return res.json({ success: true });
    }

    const db = getSQLiteDb();
    const result = await db.run(
      "UPDATE users SET password_hash = ? WHERE mongo_id = ? OR id = ?",
      hash, targetId, targetId
    );

    if (result.changes === 0) return res.status(404).json({ error: "User not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset password", details: err.message });
  }
});

// ==========================================
// 2. FAQ MODERATION
// ==========================================

// Get all FAQs (and queries to moderate)
router.get("/faqs", async (req, res) => {
  try {
    if (isMongoAvailable()) {
      const faqs = await FAQ.find().sort({ updatedAt: -1 });
      const pendingQueries = await UserQuery.find({ status: "pending" }).sort({ createdAt: -1 });
      return res.json({
        storage: "mongodb",
        faqs,
        pendingQueries
      });
    }

    const db = getSQLiteDb();
    const faqs = await db.all("SELECT * FROM faqs ORDER BY updated_at DESC");
    const pendingQueries = await db.all("SELECT * FROM user_queries WHERE status = 'pending' ORDER BY created_at DESC");
    res.json({
      storage: "sqlite",
      faqs: faqs.map(f => ({
        _id: f.mongo_id || f.id.toString(),
        question: f.question,
        answer: f.answer,
        keywords: f.keywords ? f.keywords.split(",") : [],
        updatedAt: f.updated_at
      })),
      pendingQueries: pendingQueries.map(q => ({
        _id: q.mongo_id || q.id.toString(),
        question: q.question,
        answer: q.answer,
        status: q.status,
        createdAt: q.created_at
      }))
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch FAQs", details: err.message });
  }
});

// Edit FAQ details
router.patch("/faqs/:id", async (req, res) => {
  try {
    const { question, answer, keywords } = req.body;
    const targetId = req.params.id;

    const keywordsStr = Array.isArray(keywords) ? keywords.join(",") : keywords || "";

    if (isMongoAvailable()) {
      const updatedFaq = await FAQ.findByIdAndUpdate(
        targetId,
        { question, answer, keywords: Array.isArray(keywords) ? keywords : keywords.split(",").map(k => k.trim()) },
        { new: true }
      );
      if (!updatedFaq) return res.status(404).json({ error: "FAQ not found" });

      // Sync to SQLite
      try {
        const db = getSQLiteDb();
        await db.run(
          "UPDATE faqs SET question = ?, answer = ?, keywords = ? WHERE mongo_id = ?",
          question, answer, keywordsStr, targetId
        );
      } catch (e) {}

      return res.json({ success: true, data: updatedFaq });
    }

    const db = getSQLiteDb();
    const result = await db.run(
      "UPDATE faqs SET question = ?, answer = ?, keywords = ? WHERE mongo_id = ? OR id = ?",
      question, answer, keywordsStr, targetId, targetId
    );

    if (result.changes === 0) return res.status(404).json({ error: "FAQ not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update FAQ", details: err.message });
  }
});

// Delete FAQ
router.delete("/faqs/:id", async (req, res) => {
  try {
    const targetId = req.params.id;

    if (isMongoAvailable()) {
      const deletedFaq = await FAQ.findByIdAndDelete(targetId);
      if (!deletedFaq) return res.status(404).json({ error: "FAQ not found" });

      // Sync to SQLite
      try {
        const db = getSQLiteDb();
        await db.run("DELETE FROM faqs WHERE mongo_id = ?", targetId);
      } catch (e) {}

      return res.json({ success: true });
    }

    const db = getSQLiteDb();
    const result = await db.run("DELETE FROM faqs WHERE mongo_id = ? OR id = ?", targetId, targetId);
    if (result.changes === 0) return res.status(404).json({ error: "FAQ not found" });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete FAQ", details: err.message });
  }
});

// Approve/Resolve pending user query to make it a public FAQ
router.post("/queries/:id/approve", async (req, res) => {
  try {
    const targetId = req.params.id;
    const { answer } = req.body;

    if (!answer || answer.trim() === "") {
      return res.status(400).json({ error: "An answer is required to approve the question." });
    }

    if (isMongoAvailable()) {
      const query = await UserQuery.findById(targetId);
      if (!query) return res.status(404).json({ error: "Query not found" });

      query.answer = answer;
      query.status = "resolved";
      await query.save();

      // Create FAQ item from query
      const newFaq = await FAQ.create({
        question: query.question,
        answer: query.answer,
        keywords: [query.category || "General"],
        sourceQueryId: query._id.toString()
      });

      // Sync to SQLite
      try {
        const db = getSQLiteDb();
        await db.run(
          "UPDATE user_queries SET answer = ?, status = 'resolved' WHERE mongo_id = ?",
          answer, targetId
        );
        await db.run(
          "INSERT INTO faqs (mongo_id, question, answer, keywords, source_query_id) VALUES (?, ?, ?, ?, ?)",
          newFaq._id.toString(), query.question, answer, query.category || "General", targetId
        );
      } catch (e) {}

      return res.json({ success: true, faq: newFaq });
    }

    const db = getSQLiteDb();
    const query = await db.get("SELECT * FROM user_queries WHERE mongo_id = ? OR id = ?", targetId, targetId);
    if (!query) return res.status(404).json({ error: "Query not found" });

    await db.run(
      "UPDATE user_queries SET answer = ?, status = 'resolved' WHERE mongo_id = ? OR id = ?",
      answer, targetId, targetId
    );

    const faqResult = await db.run(
      "INSERT INTO faqs (question, answer, keywords, source_query_id) VALUES (?, ?, ?, ?)",
      query.question, answer, "General", targetId
    );

    res.json({ success: true, faqId: faqResult.lastID });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve query", details: err.message });
  }
});

// Reject pending user query
router.post("/queries/:id/reject", async (req, res) => {
  try {
    const targetId = req.params.id;

    if (isMongoAvailable()) {
      const query = await UserQuery.findById(targetId);
      if (!query) return res.status(404).json({ error: "Query not found" });

      query.status = "rejected";
      await query.save();

      // Sync to SQLite
      try {
        const db = getSQLiteDb();
        await db.run("UPDATE user_queries SET status = 'rejected' WHERE mongo_id = ?", targetId);
      } catch (e) {}

      return res.json({ success: true });
    }

    const db = getSQLiteDb();
    const result = await db.run(
      "UPDATE user_queries SET status = 'rejected' WHERE mongo_id = ? OR id = ?",
      targetId, targetId
    );

    if (result.changes === 0) return res.status(404).json({ error: "Query not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to reject query", details: err.message });
  }
});

// ==========================================
// 3. REPORTS & ANALYTICS
// ==========================================

router.get("/analytics", async (req, res) => {
  try {
    let stats = {
      totalUsers: 0,
      activeUsers: 0,
      faqsCount: 0,
      queriesCount: 0,
      documentsCount: 0
    };

    if (isMongoAvailable()) {
      stats.totalUsers = await User.countDocuments();
      stats.activeUsers = await User.countDocuments({ isSuspended: false });
      stats.faqsCount = await FAQ.countDocuments();
      stats.queriesCount = await UserQuery.countDocuments();
      stats.documentsCount = await Document.countDocuments();
    } else {
      const db = getSQLiteDb();
      const userCount = await db.get("SELECT COUNT(*) as count FROM users");
      const activeCount = await db.get("SELECT COUNT(*) as count FROM users WHERE is_suspended = 0");
      const faqCount = await db.get("SELECT COUNT(*) as count FROM faqs");
      const queryCount = await db.get("SELECT COUNT(*) as count FROM user_queries");
      const docCount = await db.get("SELECT COUNT(*) as count FROM documents");

      stats.totalUsers = userCount ? userCount.count : 0;
      stats.activeUsers = activeCount ? activeCount.count : 0;
      stats.faqsCount = faqCount ? faqCount.count : 0;
      stats.queriesCount = queryCount ? queryCount.count : 0;
      stats.documentsCount = docCount ? docCount.count : 0;
    }

    // Mock timeline statistics for admin graphs & charts
    const timelineData = [
      { date: "Mon", queries: 12, resolved: 8 },
      { date: "Tue", queries: 19, resolved: 15 },
      { date: "Wed", queries: 15, resolved: 11 },
      { date: "Thu", queries: 25, resolved: 20 },
      { date: "Fri", queries: 22, resolved: 17 },
      { date: "Sat", queries: 10, resolved: 6 },
      { date: "Sun", queries: 8, resolved: 5 }
    ];

    res.json({
      stats,
      timelineData
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load analytics", details: err.message });
  }
});

// ==========================================
// 4. ADMIN PROFILE MANAGEMENT
// ==========================================

router.patch("/profile", async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminId = req.user.id;

    let updateFields = {};
    if (email) updateFields.email = email.toLowerCase().trim();

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    if (isMongoAvailable()) {
      const updatedAdmin = await User.findByIdAndUpdate(adminId, updateFields, { new: true });
      if (!updatedAdmin) return res.status(404).json({ error: "Admin user not found" });

      // Sync to SQLite
      try {
        const db = getSQLiteDb();
        if (email) {
          await db.run("UPDATE users SET email = ? WHERE mongo_id = ?", email.toLowerCase().trim(), adminId);
        }
        if (updateFields.password) {
          await db.run("UPDATE users SET password_hash = ? WHERE mongo_id = ?", updateFields.password, adminId);
        }
      } catch (e) {}

      return res.json({ success: true, email: updatedAdmin.email });
    }

    const db = getSQLiteDb();
    if (email) {
      await db.run("UPDATE users SET email = ? WHERE mongo_id = ? OR id = ?", email.toLowerCase().trim(), adminId, adminId);
    }
    if (updateFields.password) {
      await db.run("UPDATE users SET password_hash = ? WHERE mongo_id = ? OR id = ?", updateFields.password, adminId, adminId);
    }

    res.json({ success: true, email: email || req.user.email });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile", details: err.message });
  }
});

module.exports = router;
