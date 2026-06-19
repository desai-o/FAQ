const express = require("express");
const router = express.Router();
const { z } = require("zod");
const { validate } = require("../middleware/validate");

const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const FAQ = require("../models/FAQ");
const { extractKeywords } = require("../services/syncService");
const { autoFollow } = require("../services/followService");
const { dispatchNotification } = require("../services/notificationService");
const { inferCategory, normalizeTags } = require("../services/categoryService");
const { requireAuth } = require("../middleware/auth");
const { canDeleteResource } = require("../middleware/ownership");

const createFaqSchema = z.object({
  body: z.object({
    question: z.string().trim().min(3).max(500),
    answer: z.string().trim().min(1).max(3000),
    category: z.string().trim().max(100).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(10).optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const { getPagination } = require("../utils/pagination");
const { success, fail } = require("../utils/apiResponse");
const { writeLimiter } = require("../middleware/rateLimits");

router.get("/", async (req, res) => {
  try {
    const { limit, offset } = getPagination(req.query);

    if (isMongoAvailable()) {
      const [faqs, total] = await Promise.all([
        FAQ.find().sort({ createdAt: -1 }).skip(offset).limit(limit),
        FAQ.countDocuments()
      ]);

      return success(res, {
        storage: "mongodb",
        data: faqs,
        meta: { pagination: { limit, offset, total } }
      });
    }

    const db = getSQLiteDb();

    const [faqs, totalRow] = await Promise.all([
      db.all(
        `
        SELECT *
        FROM faqs
        ORDER BY created_at DESC
        LIMIT ?
        OFFSET ?
        `,
        limit,
        offset
      ),
      db.get("SELECT COUNT(*) AS total FROM faqs")
    ]);

    return success(res, {
      storage: "sqlite",
      data: faqs,
      meta: { pagination: { limit, offset, total: totalRow.total } }
    });
  } catch (error) {
    return fail(res, {
      statusCode: 500,
      code: "FAQ_FETCH_FAILED",
      message: "Failed to fetch FAQs",
      details: error.message
    });
  }
});

router.post("/", writeLimiter, validate(createFaqSchema), async (req, res) => {
  try {
    const { question, answer, category, tags } = req.body;

    const inferredCategory = category || inferCategory(`${question || ""} ${answer || ""}`);
    const normalizedTags = normalizeTags(tags || []);

    if (!question || question.trim() === "" || !answer || answer.trim() === "") {
      return fail(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "Question and answer are required"
      });
    }

    if (question.length > 500) {
      return fail(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "Question must be 500 characters or less"
      });
    }

    if (answer.length > 3000) {
      return fail(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "Answer must be 3000 characters or less"
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

      return success(res, {
        statusCode: 201,
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

    return success(res, {
      statusCode: 201,
      storage: "sqlite",
      data: {
        id: result.lastID,
        question: question.trim(),
        answer: answer.trim(),
        keywords
      }
    });
  } catch (error) {
    return fail(res, {
      statusCode: 500,
      code: "FAQ_CREATE_FAILED",
      message: "Failed to create FAQ",
      details: error.message
    });
  }
});

router.delete("/:id", requireAuth, writeLimiter, async (req, res) => {
  try {
    if (isMongoAvailable()) {
      const faq = await FAQ.findById(req.params.id);

      if (!faq) {
        return fail(res, {
          statusCode: 404,
          code: "FAQ_NOT_FOUND",
          message: "FAQ not found"
        });
      }

      if (!canDeleteResource(req.user, faq)) {
        return fail(res, {
          statusCode: 403,
          code: "FORBIDDEN",
          message: "You are not allowed to delete this FAQ"
        });
      }

      await FAQ.deleteOne({ _id: faq._id });

      return success(res, {
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
      return fail(res, {
        statusCode: 404,
        code: "FAQ_NOT_FOUND",
        message: "FAQ not found"
      });
    }

    if (!canDeleteResource(req.user, faq)) {
      return fail(res, {
        statusCode: 403,
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

    return success(res, {
      storage: "sqlite",
      data: {
        deleted: true
      }
    });
  } catch (error) {
    return fail(res, {
      statusCode: 500,
      code: "FAQ_DELETE_FAILED",
      message: "Failed to delete FAQ",
      details: error.message
    });
  }
});

module.exports = router;
