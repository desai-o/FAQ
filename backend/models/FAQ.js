const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true
    },
    answer: {
      type: String,
      required: true,
      trim: true
    },
    keywords: {
      type: [String],
      default: []
    },
    category: {
      type: String,
      default: "General",
      trim: true,
      index: true
    },
    tags: {
      type: [String],
      default: []
    },
    searchBoost: {
      type: Number,
      default: 1
    },
    sourceQueryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserQuery",
      default: null
    },
    userId: {
      type: String,
      default: "anonymous",
      index: true
    },
    authorName: {
      type: String,
      default: "Anonymous"
    }
  },
  {
    timestamps: true
  }
);

faqSchema.index(
  {
    question: "text",
    answer: "text",
    keywords: "text",
    tags: "text",
    category: "text"
  },
  {
    weights: {
      question: 10,
      category: 6,
      tags: 5,
      keywords: 4,
      answer: 2
    }
  }
);

faqSchema.index({ category: 1, createdAt: -1 });
faqSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("FAQ", faqSchema);
