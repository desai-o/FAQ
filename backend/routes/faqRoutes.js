const express = require("express");
const router = express.Router();

const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const FAQ = require("../models/FAQ");
const { extractKeywords } = require("../services/syncService");
const { autoFollow } = require("../services/followService");
const { dispatchNotification } = require("../services/notificationService");
const { inferCategory, normalizeTags } = require("../services/categoryService");
const { requireAuth } = require("../middleware/auth");
const { canDeleteResource } = require("../middleware/ownership");

router.get("/", async (req, res) => {
  try {
    if (isMongoAvailable()) {
      const faqs = await FAQ.find().sort({ createdAt: -1 });

      return res.json({
        storage: "mongodb",
        data: faqs
      });
    }

    const db = getSQLiteDb();

    const faqs = await db.all(`
      SELECT *
      FROM faqs
      ORDER BY created_at DESC
    `);

    return res.json({
      storage: "sqlite",
      data: faqs
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch FAQs",
      details: error.message
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { question, answer, category, tags } = req.body;

    const inferredCategory = category || inferCategory(`${question || ""} ${answer || ""}`);
    const normalizedTags = normalizeTags(tags || []);

    if (!question || question.trim() === "" || !answer || answer.trim() === "") {
      return res.status(400).json({
        error: "Question and answer are required"
      });
    }

    if (question.length > 500) {
      return res.status(400).json({
        error: "Question must be 500 characters or less"
      });
    }

    if (answer.length > 3000) {
      return res.status(400).json({
        error: "Answer must be 3000 characters or less"
      });
    }

    const keywords = extractKeywords(`${question} ${answer}`);

    if (isMongoAvailable()) {
      const faq = await FAQ.create({
        question: question.trim(),
        answer: answer.trim(),
        keywords,
        category: inferredCategory,
        tags: normalizedTags,
        userId: req.user?.id || "anonymous",
        authorName: req.user?.name || "Anonymous"
      });

      await autoFollow(
        req.user?.id,
        'question',
        faq.id || faq._id.toString()
      );

      for (const tag of keywords) {
        await dispatchNotification({
          eventType: 'new_question',
          triggeredByUserId: req.user?.id || "anonymous",
          followableType: 'tag',
          followableId: tag,
          message: `New question under #${tag}: ${question.substring(0, 50)}`
        });
      }

      return res.status(201).json({
        storage: "mongodb",
        data: faq
      });
    }

    const db = getSQLiteDb();

    const result = await db.run(
      `
      INSERT INTO faqs (
        question,
        answer,
        keywords,
        category,
        tags,
        user_id,
        author_name,
        synced_to_mongo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      `,
      question.trim(),
      answer.trim(),
      keywords.join(","),
      inferredCategory,
      normalizedTags.join(","),
      req.user?.id || "anonymous",
      req.user?.name || "Anonymous"
    );

    await autoFollow(
      req.user?.id,
      'question',
      result.lastID
    );

    for (const tag of keywords) {
      await dispatchNotification({
        eventType: 'new_question',
        triggeredByUserId: req.user?.id || "anonymous",
        followableType: 'tag',
        followableId: tag,
        message: `New question under #${tag}: ${question.substring(0, 50)}`
      });
    }

    return res.status(201).json({
      storage: "sqlite",
      data: {
        id: result.lastID,
        question: question.trim(),
        answer: answer.trim(),
        keywords
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to create FAQ",
      details: error.message
    });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    if (isMongoAvailable()) {
      const faq = await FAQ.findById(req.params.id);

      if (!faq) {
        return res.status(404).json({
          status: "error",
          code: "FAQ_NOT_FOUND",
          message: "FAQ not found"
        });
      }

      if (!canDeleteResource(req.user, faq)) {
        return res.status(403).json({
          status: "error",
          code: "FORBIDDEN",
          message: "You are not allowed to delete this FAQ"
        });
      }

      await FAQ.deleteOne({ _id: faq._id });

      return res.json({
        status: "success",
        storage: "mongodb",
        data: {
          deleted: true
        }
      });
    }

    const db = getSQLiteDb();

    const faq = await db.get(
      `
      SELECT *
      FROM faqs
      WHERE id = ?
      `,
      req.params.id
    );

    if (!faq) {
      return res.status(404).json({
        status: "error",
        code: "FAQ_NOT_FOUND",
        message: "FAQ not found"
      });
    }

    if (!canDeleteResource(req.user, faq)) {
      return res.status(403).json({
        status: "error",
        code: "FORBIDDEN",
        message: "You are not allowed to delete this FAQ"
      });
    }

    await db.run(
      `
      DELETE FROM faqs
      WHERE id = ?
      `,
      req.params.id
    );

    return res.json({
      status: "success",
      storage: "sqlite",
      data: {
        deleted: true
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      code: "FAQ_DELETE_FAILED",
      message: "Failed to delete FAQ",
      details: error.message
    });
  }
});

module.exports = router;
