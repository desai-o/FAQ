const express = require("express");
const router = express.Router();

const { generateSummary, queryRAG } = require("../services/aiService");

router.post("/summary", async (req, res) => {
  try {
    const { question, answers } = req.body;

    const summary = await generateSummary(question, answers);

    res.json({
      summary,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to generate summary",
    });
  }
});

router.post("/chat", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || question.trim() === "") {
      return res.status(400).json({ error: "Question is required" });
    }

    const result = await queryRAG(question);

    res.json(result);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to query AI assistant",
      details: error.message
    });
  }
});

module.exports = router;