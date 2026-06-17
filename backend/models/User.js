const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    questionsCount: {
      type: Number,
      default: 0
    },
    answersCount: {
      type: Number,
      default: 0
    },
    reputation: {
      type: Number,
      default: 0
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    isSuspended: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
