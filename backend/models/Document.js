const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      trim: true
    },
    filepath: {
      type: String,
      required: true
    },
    filetype: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending"
    },
    chunkCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Document", documentSchema);
