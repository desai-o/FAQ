const mongoose = require("mongoose");

const faqTranslationSchema = new mongoose.Schema(
  {
    faqId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FAQ",
      required: true,
      index: true
    },
    language: {
      type: String,
      required: true,
      index: true
    },
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
    translatedBy: {
      type: String,
      default: "ai",
      enum: ["user", "ai"]
    },
    translationProvenance: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

faqTranslationSchema.index({ faqId: 1, language: 1 }, { unique: true });

module.exports = mongoose.model("FAQTranslation", faqTranslationSchema);
