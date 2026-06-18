const express = require("express");
const router = express.Router();
const { z } = require("zod");
const { validate } = require("../middleware/validate");

const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const Answer = require("../models/Answer");
const FAQ = require("../models/FAQ");
const UserQuery = require("../models/UserQuery");
const { trackEvent } = require("../services/eventService");
const { requireAuth } = require("../middleware/auth");
const { canDeleteResource } = require("../middleware/ownership");
const { dispatchNotification } = require("../services/notificationService");
const { getPagination } = require("../utils/pagination");
const { success, fail } = require("../utils/apiResponse");
const { writeLimiter } = require("../middleware/rateLimits");

const createAnswerSchema = z.object({
  body: z.object({
    questionId: z.string().trim().min(1).optional().nullable(),
    queryId: z.string().trim().min(1).optional().nullable(),
    content: z.string().trim().min(1).max(5000),
    author: z.string().trim().max(100).optional().nullable()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

async function validateAnswerTarget({ questionId, queryId, storage }) {
  if (storage === "mongodb") {
    if (questionId) {
      const faqExists = await FAQ.exists({ _id: questionId });
      if (!faqExists) {
        return {
          ok: false,
          statusCode: 404,
          code: "QUESTION_NOT_FOUND",
          message: "Referenced question was not found"
        };
      }
    }

    if (queryId) {
      const queryExists = await UserQuery.exists({ _id: queryId });
      if (!queryExists) {
        return {
          ok: false,
          statusCode: 404,
          code: "QUERY_NOT_FOUND",
          message: "Referenced query was not found"
        };
      }
    }

    return { ok: true };
  }

  const db = getSQLiteDb();

  if (questionId) {
    const faq = await db.get(
      `
      SELECT id
      FROM faqs
      WHERE id = ?
         OR mongo_id = ?
      `,
      questionId,
      questionId
    );

    if (!faq) {
      return {
        ok: false,
        statusCode: 404,
        code: "QUESTION_NOT_FOUND",
        message: "Referenced question was not found"
      };
    }
  }

  if (queryId) {
    const query = await db.get(
      `
      SELECT id
      FROM user_queries
      WHERE id = ?
         OR mongo_id = ?
      `,
      queryId,
      queryId
    );

    if (!query) {
      return {
        ok: false,
        statusCode: 404,
        code: "QUERY_NOT_FOUND",
        message: "Referenced query was not found"
      };
    }
  }

  return { ok: true };
}

router.post("/", requireAuth, writeLimiter, validate(createAnswerSchema), async (req, res) => {
  try {
    const { questionId, queryId, content, author } = req.body;

    if (!content || content.trim() === "") {
      return fail(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "Answer content is required"
      });
    }

    if (!questionId && !queryId) {
      return fail(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "questionId or queryId is required"
      });
    }

    const actorId = req.user?.id || "anonymous";
    const actorName = req.user?.name || author || "Community Member";

    const targetValidation = await validateAnswerTarget({
      questionId,
      queryId,
      storage: isMongoAvailable() ? "mongodb" : "sqlite"
    });

    if (!targetValidation.ok) {
      return fail(res, {
        statusCode: targetValidation.statusCode,
        code: targetValidation.code,
        message: targetValidation.message
      });
    }

    if (isMongoAvailable()) {
      const answer = await Answer.create({
        questionId: questionId || null,
        queryId: queryId || null,
        content: content.trim(),
        author: actorName,
        userId: actorId,
        authorName: actorName
      });

      await trackEvent({
        type: "answer_created",
        userId: actorId,
        targetType: "answer",
        targetId: String(answer._id),
        metadata: {
          questionId,
          queryId,
          storage: "mongodb"
        }
      });

await dispatchNotification({
  eventType: "answer_created",
  triggeredByUserId: actorId,
  followableType: questionId ? "question" : "query",
  followableId: String(questionId || queryId),
  message: `New answer posted: "${content.substring(0, 40)}..."`
}).catch((err) =>
  console.error("Error dispatching notification:", err)
);

return success(res, {
  statusCode: 201,
  storage: "mongodb",
  data: answer
});

    }


    const db = getSQLiteDb();

    const result = await db.run(
      `
      INSERT INTO answers (
        question_id,
        query_id,
        content,
        author,
        user_id,
        author_name,
        synced_to_mongo
      )
      VALUES (?, ?, ?, ?, ?, ?, 0)
      `,
      questionId || null,
      queryId || null,
      content.trim(),
      actorName,
      actorId,
      actorName
    );

    await trackEvent({
      type: "answer_created",
      userId: actorId,
      targetType: "answer",
      targetId: String(result.lastID),
      metadata: {
        questionId,
        queryId,
        storage: "sqlite"
      }
    });
    await dispatchNotification({
      eventType: "answer_created",
      triggeredByUserId: actorId,
      followableType: questionId ? "question" : "query",
      followableId: String(questionId || queryId),
      message: `New answer posted: "${content.substring(0, 40)}..."`
    }).catch((err) => console.error("Error dispatching notification:", err));

    return success(res, {
      statusCode: 201,
      storage: "sqlite",
      data: {
        id: result.lastID,
        questionId,
        queryId,
        content: content.trim(),
        author: actorName,
        votes: 0,
        isBest: false
      }
    });
  } catch (error) {
    return fail(res, {
      statusCode: 500,
      code: "ANSWER_CREATE_FAILED",
      message: "Failed to submit answer",
      details: error.message
    });
  }
});

router.get("/query/:queryId", async (req, res) => {
  try {
    const { queryId } = req.params;
    const { limit, offset } = getPagination(req.query);

    if (isMongoAvailable()) {
      const [answers, total] = await Promise.all([
        Answer.find({ queryId }).sort({ createdAt: -1 }).skip(offset).limit(limit),
        Answer.countDocuments({ queryId })
      ]);

      return success(res, {
        storage: "mongodb",
        data: answers,
        meta: { pagination: { limit, offset, total } }
      });
    }

    const db = getSQLiteDb();

    const [answers, totalRow] = await Promise.all([
      db.all(
        `
        SELECT *
        FROM answers
        WHERE query_id = ?
        ORDER BY created_at DESC
        LIMIT ?
        OFFSET ?
        `,
        queryId,
        limit,
        offset
      ),
      db.get("SELECT COUNT(*) AS total FROM answers WHERE query_id = ?", queryId)
    ]);

    return success(res, {
      storage: "sqlite",
      data: answers,
      meta: { pagination: { limit, offset, total: totalRow.total } }
    });
  } catch (error) {
    return fail(res, {
      statusCode: 500,
      code: "QUERY_ANSWERS_FETCH_FAILED",
      message: "Failed to fetch query answers",
      details: error.message
    });
  }
});

router.get("/:questionId", async (req, res) => {
  try {
    const { questionId } = req.params;
    const { limit, offset } = getPagination(req.query);

    if (isMongoAvailable()) {
      const [answers, total] = await Promise.all([
        Answer.find({ questionId }).sort({ createdAt: -1 }).skip(offset).limit(limit),
        Answer.countDocuments({ questionId })
      ]);

      return success(res, {
        storage: "mongodb",
        data: answers,
        meta: { pagination: { limit, offset, total } }
      });
    }

    const db = getSQLiteDb();

    const [answers, totalRow] = await Promise.all([
      db.all(
        `
        SELECT *
        FROM answers
        WHERE question_id = ?
        ORDER BY created_at DESC
        LIMIT ?
        OFFSET ?
        `,
        questionId,
        limit,
        offset
      ),
      db.get("SELECT COUNT(*) AS total FROM answers WHERE question_id = ?", questionId)
    ]);

    return success(res, {
      storage: "sqlite",
      data: answers,
      meta: { pagination: { limit, offset, total: totalRow.total } }
    });
  } catch (error) {
    return fail(res, {
      statusCode: 500,
      code: "ANSWERS_FETCH_FAILED",
      message: "Failed to fetch answers",
      details: error.message
    });
  }
});

router.delete("/:id", requireAuth, writeLimiter, async (req, res) => {
  try {
    if (isMongoAvailable()) {
      const answer = await Answer.findById(req.params.id);

      if (!answer) {
        return fail(res, {
          statusCode: 404,
          code: "ANSWER_NOT_FOUND",
          message: "Answer not found"
        });
      }

      if (!canDeleteResource(req.user, answer)) {
        return fail(res, {
          statusCode: 403,
          code: "FORBIDDEN",
          message: "You are not allowed to delete this answer"
        });
      }

      await Answer.deleteOne({ _id: answer._id });

      return success(res, {
        storage: "mongodb",
        data: {
          deleted: true
        }
      });
    }

    const db = getSQLiteDb();

    const answer = await db.get(
      `
      SELECT *
      FROM answers
      WHERE id = ?
      `,
      req.params.id
    );

    if (!answer) {
      return fail(res, {
        statusCode: 404,
        code: "ANSWER_NOT_FOUND",
        message: "Answer not found"
      });
    }

    if (!canDeleteResource(req.user, answer)) {
      return fail(res, {
        statusCode: 403,
        code: "FORBIDDEN",
        message: "You are not allowed to delete this answer"
      });
    }

    await db.run(
      `
      DELETE FROM answers
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
      code: "ANSWER_DELETE_FAILED",
      message: "Failed to delete answer",
      details: error.message
    });
  }
});

module.exports = router;
