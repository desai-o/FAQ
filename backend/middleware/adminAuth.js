const jwt = require("jsonwebtoken");
const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const User = require("../models/User");

const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "crowdfaq_secret_key_12345");

    let userRole = "user";
    let userDetails = null;

    if (isMongoAvailable()) {
      try {
        const user = await User.findById(decoded.id).select("-password");
        if (user) {
          userRole = user.role || "user";
          userDetails = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: userRole,
            isSuspended: user.isSuspended,
            storage: "mongodb"
          };
        }
      } catch (mongoErr) {
        console.error("Admin Auth middleware Mongo error:", mongoErr.message);
      }
    }

    if (!userDetails) {
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

      userRole = user.role || "user";
      userDetails = {
        id: user.mongo_id || user.id.toString(),
        sqliteId: user.id,
        name: user.name,
        email: user.email,
        role: userRole,
        isSuspended: Boolean(user.is_suspended),
        storage: "sqlite"
      };
    }

    if (userDetails.isSuspended) {
      return res.status(403).json({ error: "Your account is suspended." });
    }

    if (userRole !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin role required." });
    }

    req.user = userDetails;
    next();
  } catch (err) {
    res.status(401).json({ error: "Token is not valid" });
  }
};

module.exports = authenticateAdmin;
