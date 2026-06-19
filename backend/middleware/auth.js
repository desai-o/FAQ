const jwt = require("jsonwebtoken");
const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const User = require("../models/User");

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  return process.env.JWT_SECRET;
}

async function resolveUserById(decodedId) {
  if (isMongoAvailable()) {
    const user = await User.findById(decodedId).select("-password -passwordHash");

    if (user) {
      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role || "student",
        questionsCount: user.questionsCount || 0,
        answersCount: user.answersCount || 0,
        reputation: user.reputation || 0,
        storage: "mongodb"
      };
    }
  }

  const db = getSQLiteDb();

  const sqliteUser = await db.get(
    `
    SELECT *
    FROM users
    WHERE mongo_id = ?
       OR id = ?
    `,
    decodedId,
    decodedId
  );

  if (!sqliteUser) return null;

  return {
    id: sqliteUser.mongo_id || String(sqliteUser.id),
    sqliteId: sqliteUser.id,
    name: sqliteUser.name,
    email: sqliteUser.email,
    role: sqliteUser.role || "student",
    questionsCount: sqliteUser.questions_count || 0,
    answersCount: sqliteUser.answers_count || 0,
    reputation: sqliteUser.reputation || 0,
    storage: "sqlite"
  };
}

async function optionalAuth(req, res, next) {
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

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, getJwtSecret());

    const user = await resolveUserById(decoded.id);

    if (!user) {
      req.user = {
        id: "anonymous",
        role: "anonymous",
        name: "Anonymous"
      };
      return next();
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
    return next();
  }
}

async function requireAuth(req, res, next) {
  await optionalAuth(req, res, () => {
    if (!req.user || req.user.id === "anonymous") {
      return res.status(401).json({
        status: "error",
        code: "AUTH_REQUIRED",
        message: "Authentication required"
      });
    }

    return next();
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        code: "FORBIDDEN",
        message: "Insufficient permissions"
      });
    }

    return next();
  };
}

module.exports = {
  optionalAuth,
  requireAuth,
  requireRole
};
