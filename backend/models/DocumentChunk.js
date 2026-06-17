const mongoose = require("mongoose");

const documentChunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true
    },
    content: {
      type: String,
      required: true
    },
    chunkIndex: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("DocumentChunk", documentChunkSchema);
