const express = require("express");
const router = express.Router();

const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const Answer = require("../models/Answer");
const { trackEvent } = require("../services/eventService");

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
        author: author || "Community Member"
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
        synced_to_mongo
      )
      VALUES (?, ?, ?, ?, 0)
      `,
      questionId || null,
      queryId || null,
      content.trim(),
      author || "Community Member"
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

module.exports = router;
