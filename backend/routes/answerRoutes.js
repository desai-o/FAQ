const express = require("express");
const router = express.Router();

const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const Answer = require("../models/Answer");
const { trackEvent } = require("../services/eventService");
const { dispatchNotification } = require("../services/notificationService");
const { requireAuth } = require("../middleware/auth");
const { canDeleteResource } = require("../middleware/ownership");

router.post("/", async (req, res) => {
  try {
    const { questionId, queryId, content, author } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        error: "Answer content is required"
      });
    }

    if (!questionId && !queryId) {
      return res.status(400).json({
        error: "questionId or queryId is required"
      });
    }

    if (isMongoAvailable()) {
      const answer = await Answer.create({
        questionId: questionId || null,
        queryId: queryId || null,
        content: content.trim(),
        author: author || req.user?.name || "Community Member",
        userId: req.user?.id || "anonymous",
        authorName: req.user?.name || author || "Community Member"
      });

      await trackEvent({
        type: "answer_created",
        userId: author || "anonymous",
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
        triggeredByUserId: req.headers['user-id'] || req.body.userId || "anonymous",
        followableType: "question",
        followableId: String(questionId || queryId),
        message: `New answer posted: "${content.substring(0, 40)}..."`
      }).catch(err => console.error("Error dispatching notification:", err));

      return res.status(201).json({
        status: "success",
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
      author || req.user?.name || "Community Member",
      req.user?.id || "anonymous",
      req.user?.name || author || "Community Member"
    );

    await trackEvent({
      type: "answer_created",
      userId: author || "anonymous",
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
      triggeredByUserId: req.headers['user-id'] || req.body.userId || "anonymous",
      followableType: "question",
      followableId: String(questionId || queryId),
      message: `New answer posted: "${content.substring(0, 40)}..."`
    }).catch(err => console.error("Error dispatching notification:", err));

    return res.status(201).json({
      status: "success",
      storage: "sqlite",
      data: {
        id: result.lastID,
        questionId,
        queryId,
        content: content.trim(),
        author: author || "Community Member",
        votes: 0,
        isBest: false
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to submit answer",
      details: error.message
    });
  }
});

router.get("/:questionId", async (req, res) => {
  try {
    const { questionId } = req.params;

    if (isMongoAvailable()) {
      const answers = await Answer.find({ questionId }).sort({ createdAt: -1 });

      return res.json({
        status: "success",
        storage: "mongodb",
        data: answers
      });
    }

    const db = getSQLiteDb();

    const answers = await db.all(
      `
      SELECT *
      FROM answers
      WHERE question_id = ?
      ORDER BY created_at DESC
      `,
      questionId
    );

    return res.json({
      status: "success",
      storage: "sqlite",
      data: answers
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch answers",
      details: error.message
    });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    if (isMongoAvailable()) {
      const answer = await Answer.findById(req.params.id);

      if (!answer) {
        return res.status(404).json({
          status: "error",
          code: "ANSWER_NOT_FOUND",
          message: "Answer not found"
        });
      }

      if (!canDeleteResource(req.user, answer)) {
        return res.status(403).json({
          status: "error",
          code: "FORBIDDEN",
          message: "You are not allowed to delete this answer"
        });
      }

      await Answer.deleteOne({ _id: answer._id });

      return res.json({
        status: "success",
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
      return res.status(404).json({
        status: "error",
        code: "ANSWER_NOT_FOUND",
        message: "Answer not found"
      });
    }

    if (!canDeleteResource(req.user, answer)) {
      return res.status(403).json({
        status: "error",
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
      code: "ANSWER_DELETE_FAILED",
      message: "Failed to delete answer",
      details: error.message
    });
  }
});

module.exports = router;
