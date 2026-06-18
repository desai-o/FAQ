const express = require("express");
const router = express.Router();

const { generateSummary } = require("../services/aiService");
const { aiLimiter } = require("../middleware/rateLimits");

router.post("/summary", aiLimiter, async (req, res) => {
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

module.exports = router;