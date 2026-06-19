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
const { requireAuth, requireRole } = require("../middleware/auth");
const { canDeleteResource } = require("../middleware/ownership");
const { adjustUserStats } = require("../services/badgeService");
const { saveFaqRevision, getFaqRevisions, rollbackFaq } = require("../services/revisionService");
const { createModerationRecord } = require("../services/moderationService");

const createFaqSchema = z.object({
  body: z.object({
    question: z.string().trim().min(3).max(500),
    answer: z.string().trim().min(1).max(3000),
    category: z.string().trim().max(100).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).min(1).max(10)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const updateFaqSchema = z.object({
  body: z.object({
    question: z.string().trim().min(3).max(500).optional(),
    answer: z.string().trim().min(1).max(3000).optional(),
    category: z.string().trim().max(100).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).min(1).max(10).optional()
  }),
  params: z.object({
    id: z.string().min(1)
  }),
  query: z.object({}).optional()
});

const flagStaleFaqSchema = z.object({
  body: z.object({
    reason: z.string().trim().min(1).max(1000)
  }),
  params: z.object({
    id: z.string().min(1)
  }),
  query: z.object({}).optional()
});

const { getPagination } = require("../utils/pagination");
const { success, fail } = require("../utils/apiResponse");
const { writeLimiter } = require("../middleware/rateLimits");


router.get("/", async (req, res) => {
  try {
    const { limit, offset } = getPagination(req.query);

    if (isMongoAvailable()) {
      const filter = { moderationStatus: { $nin: ["needs_review", "rejected"] } };
      const [faqs, total] = await Promise.all([
        FAQ.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit),
        FAQ.countDocuments(filter)
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
        WHERE moderation_status NOT IN ('needs_review', 'rejected')
        ORDER BY created_at DESC
        LIMIT ?
        OFFSET ?
        `,
        limit,
        offset
      ),
      db.get("SELECT COUNT(*) AS total FROM faqs WHERE moderation_status NOT IN ('needs_review', 'rejected')")
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

      // Run AI moderation check
      const modResult = await createModerationRecord({
        targetType: "faq",
        targetId: String(faq._id),
        text: `${question} ${answer}`
      });

      if (modResult.flagged) {
        faq.moderationStatus = "needs_review";
        await faq.save();
      }

      await adjustUserStats(req.user?.id, { questionsCountDelta: 1, reputationDelta: 2 });


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

    // Run AI moderation check
    const modResult = await createModerationRecord({
      targetType: "faq",
      targetId: String(result.lastID),
      text: `${question} ${answer}`
    });

    if (modResult.flagged) {
      await db.run("UPDATE faqs SET moderation_status = 'needs_review' WHERE id = ?", result.lastID);
    }

    await adjustUserStats(req.user?.id, { questionsCountDelta: 1, reputationDelta: 2 });


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
        keywords,
        moderationStatus: modResult.flagged ? "needs_review" : "approved"
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
      await adjustUserStats(faq.userId, { questionsCountDelta: -1, reputationDelta: -2 });


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

    await adjustUserStats(faq.user_id, { questionsCountDelta: -1, reputationDelta: -2 });


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

// Edit FAQ
router.patch("/:id", requireAuth, writeLimiter, validate(updateFaqSchema), async (req, res) => {
  try {
    const { question, answer, category, tags } = req.body;

    if (isMongoAvailable()) {
      const faq = await FAQ.findById(req.params.id);
      if (!faq) {
        return fail(res, { statusCode: 404, code: "FAQ_NOT_FOUND", message: "FAQ not found" });
      }

      if (faq.userId !== req.user.id && req.user.role !== "admin" && req.user.role !== "moderator") {
        return fail(res, { statusCode: 403, code: "FORBIDDEN", message: "Not allowed to edit this FAQ" });
      }

      // Save revision of current state
      await saveFaqRevision(faq._id, {
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        tags: faq.tags,
        userId: req.user.id,
        authorName: req.user.name
      });

      if (question !== undefined) faq.question = question.trim();
      if (answer !== undefined) faq.answer = answer.trim();
      if (category !== undefined) faq.category = category.trim();
      if (tags !== undefined) faq.tags = tags;
      await faq.save();

      return success(res, { storage: "mongodb", data: faq });
    }

    const db = getSQLiteDb();
    const faq = await db.get("SELECT * FROM faqs WHERE id = ?", req.params.id);
    if (!faq) {
      return fail(res, { statusCode: 404, code: "FAQ_NOT_FOUND", message: "FAQ not found" });
    }

    if (faq.user_id !== req.user.id && req.user.role !== "admin" && req.user.role !== "moderator") {
      return fail(res, { statusCode: 403, code: "FORBIDDEN", message: "Not allowed to edit this FAQ" });
    }

    // Save revision of current state
    await saveFaqRevision(faq.id, {
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      tags: faq.tags,
      userId: req.user.id,
      authorName: req.user.name
    });

    const updatedQuestion = question !== undefined ? question.trim() : faq.question;
    const updatedAnswer = answer !== undefined ? answer.trim() : faq.answer;
    const updatedCategory = category !== undefined ? category.trim() : faq.category;
    const updatedTags = tags !== undefined ? tags.join(",") : faq.tags;

    await db.run(
      `
      UPDATE faqs
      SET question = ?,
          answer = ?,
          category = ?,
          tags = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      updatedQuestion,
      updatedAnswer,
      updatedCategory,
      updatedTags,
      req.params.id
    );

    const updated = await db.get("SELECT * FROM faqs WHERE id = ?", req.params.id);
    return success(res, { storage: "sqlite", data: updated });
  } catch (error) {
    return fail(res, { statusCode: 500, code: "FAQ_UPDATE_FAILED", message: error.message });
  }
});

// Flag FAQ as stale
router.post("/:id/flag-stale", requireAuth, writeLimiter, validate(flagStaleFaqSchema), async (req, res) => {
  try {
    const { reason } = req.body;

    if (isMongoAvailable()) {
      const faq = await FAQ.findById(req.params.id);
      if (!faq) {
        return fail(res, { statusCode: 404, code: "FAQ_NOT_FOUND", message: "FAQ not found" });
      }

      faq.needsUpdate = true;
      faq.updateReason = reason;
      await faq.save();

      return success(res, { storage: "mongodb", data: faq });
    }

    const db = getSQLiteDb();
    const result = await db.run(
      `
      UPDATE faqs
      SET needs_update = 1,
          update_reason = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      reason,
      req.params.id
    );

    if (result.changes === 0) {
      return fail(res, { statusCode: 404, code: "FAQ_NOT_FOUND", message: "FAQ not found" });
    }

    const updated = await db.get("SELECT * FROM faqs WHERE id = ?", req.params.id);
    return success(res, { storage: "sqlite", data: updated });
  } catch (error) {
    return fail(res, { statusCode: 500, code: "FAQ_FLAG_STALE_FAILED", message: error.message });
  }
});

// Mark FAQ as reviewed (Admin/Moderator only)
router.patch("/:id/reviewed", requireAuth, requireRole("moderator", "admin"), writeLimiter, async (req, res) => {
  try {
    const now = new Date();

    if (isMongoAvailable()) {
      const faq = await FAQ.findById(req.params.id);
      if (!faq) {
        return fail(res, { statusCode: 404, code: "FAQ_NOT_FOUND", message: "FAQ not found" });
      }

      faq.lastReviewedAt = now;
      faq.staleScore = 0;
      faq.needsUpdate = false;
      faq.updateReason = "";
      await faq.save();

      return success(res, { storage: "mongodb", data: faq });
    }

    const db = getSQLiteDb();
    const result = await db.run(
      `
      UPDATE faqs
      SET last_reviewed_at = ?,
          stale_score = 0,
          needs_update = 0,
          update_reason = '',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      now.toISOString(),
      req.params.id
    );

    if (result.changes === 0) {
      return fail(res, { statusCode: 404, code: "FAQ_NOT_FOUND", message: "FAQ not found" });
    }

    const updated = await db.get("SELECT * FROM faqs WHERE id = ?", req.params.id);
    return success(res, { storage: "sqlite", data: updated });
  } catch (error) {
    return fail(res, { statusCode: 500, code: "FAQ_REVIEWED_FAILED", message: error.message });
  }
});

// Get FAQ revisions
router.get("/:id/revisions", async (req, res) => {
  try {
    const revisions = await getFaqRevisions(req.params.id);
    return success(res, { data: revisions });
  } catch (error) {
    return fail(res, { statusCode: 500, code: "GET_REVISIONS_FAILED", message: error.message });
  }
});

// Rollback FAQ
router.post("/:id/revisions/:revisionId/rollback", requireAuth, requireRole("moderator", "admin"), async (req, res) => {
  try {
    const rolledBack = await rollbackFaq(req.params.id, req.params.revisionId, req.user);
    return success(res, { data: rolledBack });
  } catch (error) {
    return fail(res, { statusCode: 500, code: "ROLLBACK_FAILED", message: error.message });
  }
});

const { importContent, generateThreadFromDocument } = require("../services/importService");

const importFaqSchema = z.object({
  body: z.object({
    format: z.enum(["json", "csv", "markdown", "md"]),
    content: z.string().min(1),
    dryRun: z.boolean().optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const generateThreadSchema = z.object({
  body: z.object({
    fileName: z.string().min(1),
    fileContent: z.string().min(1)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

// Bulk import FAQs
router.post("/import", requireAuth, writeLimiter, validate(importFaqSchema), async (req, res) => {
  try {
    const { format, content, dryRun } = req.body;
    const result = await importContent({
      format,
      content,
      userId: req.user.id,
      authorName: req.user.name,
      dryRun
    });

    if (result.status === "error") {
      return fail(res, { statusCode: 500, code: "IMPORT_FAILED", message: result.message, details: result.errors });
    }
    if (result.status === "invalid") {
      return fail(res, { statusCode: 400, code: "VALIDATION_ERROR", message: result.message, details: result.errors });
    }

    return success(res, { data: result });
  } catch (error) {
    return fail(res, { statusCode: 500, code: "IMPORT_FAILED", message: error.message });
  }
});

// PDF/Word automatic thread generation
router.post("/generate-thread", requireAuth, writeLimiter, validate(generateThreadSchema), async (req, res) => {
  try {
    const { fileName, fileContent } = req.body;
    const results = await generateThreadFromDocument({
      fileBuffer: Buffer.from(fileContent, "base64"),
      fileName,
      userId: req.user.id,
      authorName: req.user.name
    });

    return success(res, { data: results });
  } catch (error) {
    return fail(res, { statusCode: 500, code: "THREAD_GENERATION_FAILED", message: error.message });
  }
});

// Translation routes

// POST /api/faqs/:id/translations
router.post("/:id/translations", requireAuth, writeLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { language, question, answer } = req.body;

    if (!language || language.trim() === "") {
      return fail(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "Language is required for translation"
      });
    }

    const { addFAQTranslation } = require("../services/translationService");
    const result = await addFAQTranslation({
      faqId: id,
      language: language.trim(),
      question: question ? question.trim() : undefined,
      answer: answer ? answer.trim() : undefined,
      userId: req.user.id
    });

    return success(res, {
      statusCode: 201,
      data: result
    });
  } catch (error) {
    return fail(res, {
      statusCode: 500,
      code: "FAQ_TRANSLATION_FAILED",
      message: "Failed to add translation",
      details: error.message
    });
  }
});

// GET /api/faqs/:id/translations
router.get("/:id/translations", async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoAvailable()) {
      const FAQTranslation = require("../models/FAQTranslation");
      const translations = await FAQTranslation.find({ faqId: id });
      return success(res, {
        storage: "mongodb",
        data: translations
      });
    }

    const db = getSQLiteDb();
    const translations = await db.all("SELECT * FROM faq_translations WHERE faq_id = ?", id);

    return success(res, {
      storage: "sqlite",
      data: translations.map(t => ({
        ...t,
        faqId: t.faq_id,
        translatedBy: t.translated_by,
        translationProvenance: t.translation_provenance
      }))
    });
  } catch (error) {
    return fail(res, {
      statusCode: 500,
      code: "FAQ_TRANSLATION_FETCH_FAILED",
      message: "Failed to fetch translations",
      details: error.message
    });
  }
});

module.exports = router;

