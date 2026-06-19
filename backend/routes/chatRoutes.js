const express = require("express");
const router = express.Router();
const { runChatAssistant } = require("../services/chatRetrievalService");
const { requireAuth } = require("../middleware/auth");
const { success, fail } = require("../utils/apiResponse");

router.post("/", requireAuth, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || message.trim() === "") {
      return fail(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "Message is required"
      });
    }

    const userId = req.user?.id || "anonymous";
    const result = await runChatAssistant({ message, history, userId });

    return success(res, {
      data: result
    });
  } catch (error) {
    return fail(res, {
      statusCode: 500,
      code: "CHAT_ASSISTANT_FAILED",
      message: "Chat assistant error occurred",
      details: error.message
    });
  }
});

module.exports = router;
