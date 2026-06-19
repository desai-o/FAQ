const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FAQ",
      default: null
    },
    queryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserQuery",
      default: null
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: String,
      default: "Community Member",
      trim: true
    },
    userId: {
      type: String,
      default: "anonymous",
      index: true
    },
    authorName: {
      type: String,
      default: "Community Member",
      trim: true
    },
    votes: {
      type: Number,
      default: 0
    },
    isBest: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: String,
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    verificationNote: {
      type: String,
      default: null
    },
    moderationStatus: {
      type: String,
      default: "approved",
      enum: ["auto_clear", "needs_review", "escalated", "approved", "rejected"]
    }
  },
  {
    timestamps: true
  }
);

answerSchema.index({ content: "text", author: "text" });

module.exports = mongoose.model("Answer", answerSchema);
