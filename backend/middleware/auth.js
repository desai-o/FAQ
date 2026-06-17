const jwt = require("jsonwebtoken");
const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const User = require("../models/User");

const authenticateUser = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "crowdfaq_secret_key_12345");
    
    if (isMongoAvailable()) {
      try {
        const user = await User.findById(decoded.id).select("-password");
        if (user) {
          if (user.isSuspended) {
            return res.status(403).json({ error: "Your account is suspended." });
          }
          req.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role || "user",
            isSuspended: user.isSuspended,
            questionsCount: user.questionsCount,
            answersCount: user.answersCount,
            reputation: user.reputation,
            storage: "mongodb"
          };
          return next();
        }
      } catch (mongoErr) {
        console.error("Auth middleware Mongo error:", mongoErr.message);
      }
    }

    // SQLite Fallback
    const db = getSQLiteDb();
    const user = await db.get(
      "SELECT * FROM users WHERE mongo_id = ? OR id = ?",
      decoded.id,
      decoded.id
    );

    if (!user) {
      return res.status(401).json({ error: "Token is not valid or user not found" });
    }

    if (user.is_suspended) {
      return res.status(403).json({ error: "Your account is suspended." });
    }

    req.user = {
      id: user.mongo_id || user.id.toString(),
      sqliteId: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "user",
      isSuspended: Boolean(user.is_suspended),
      questionsCount: user.questions_count,
      answersCount: user.answers_count,
      reputation: user.reputation,
      storage: "sqlite"
    };
    next();
  } catch (err) {
    res.status(401).json({ error: "Token is not valid" });
  }
};

module.exports = authenticateUser;
