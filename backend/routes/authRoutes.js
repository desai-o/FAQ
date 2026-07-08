const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { success, fail } = require("../utils/apiResponse");
const { authLimiter } = require("../middleware/rateLimits");

// JWT signature function
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
};

// @route   POST api/auth/signup
// @desc    Register a user
// @access  Public
router.post("/signup", authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || name.trim() === "" || !email || email.trim() === "" || !password || password.trim() === "") {
      return fail(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "Please enter all fields"
      });
    }

    if (password.length < 6) {
      return fail(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "Password must be at least 6 characters"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists (MongoDB or SQLite)
    let userExists = false;

    if (isMongoAvailable()) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) userExists = true;
    } else {
      const db = getSQLiteDb();
      const existingUser = await db.get("SELECT * FROM users WHERE email = ?", normalizedEmail);
      if (existingUser) userExists = true;
    }

    if (userExists) {
      return fail(res, {
        statusCode: 400,
        code: "USER_EXISTS",
        message: "User already exists with this email"
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let userId = null;
    let savedUser = null;

    if (isMongoAvailable()) {
      // Save to Mongo
      const newUser = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "student"
      });

      userId = newUser._id.toString();
      savedUser = {
        id: userId,
        name: newUser.name,
        email: newUser.email,
        questionsCount: 0,
        answersCount: 0,
        reputation: 0,
        badges: newUser.badges || [],
        storage: "mongodb"
      };

      // Also save to SQLite so credentials match offline
      try {
        const db = getSQLiteDb();
        await db.run(
          `INSERT INTO users (mongo_id, name, email, password_hash) VALUES (?, ?, ?, ?)`,
          userId,
          name.trim(),
          normalizedEmail,
          passwordHash
        );
      } catch (sqLiteErr) {
        console.error("Failed to sync new user to SQLite fallback during signup:", sqLiteErr.message);
      }
    } else {
      // Save only to SQLite fallback
      const db = getSQLiteDb();
      const result = await db.run(
        `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`,
        name.trim(),
        normalizedEmail,
        passwordHash
      );

      userId = result.lastID.toString();
      savedUser = {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        questionsCount: 0,
        answersCount: 0,
        reputation: 0,
        badges: [],
        storage: "sqlite"
      };
    }

    // Generate JWT
    const token = generateToken(userId);

    return success(res, {
      statusCode: 201,
      storage: savedUser.storage,
      data: savedUser,
      meta: { token, user: savedUser }
    });
  } catch (error) {
    return fail(res, {
      statusCode: 500,
      code: "INTERNAL_SERVER_ERROR",
      message: "Signup failed",
      details: error.message
    });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || email.trim() === "" || !password || password.trim() === "") {
      return fail(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "Please enter all fields"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user = null;
    let isMatch = false;

    if (isMongoAvailable()) {
      user = await User.findOne({ email: normalizedEmail });
      if (user) {
        isMatch = await bcrypt.compare(password, user.passwordHash);
        if (isMatch) {
          const token = generateToken(user._id.toString());
          const userObj = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            questionsCount: user.questionsCount,
            answersCount: user.answersCount,
            reputation: user.reputation,
            badges: user.badges || [],
            storage: "mongodb"
          };
          return success(res, {
            storage: "mongodb",
            data: userObj,
            meta: { token, user: userObj }
          });
        }
      }
    }

    // Fallback or secondary check on SQLite
    const db = getSQLiteDb();
    const sqliteUser = await db.get("SELECT * FROM users WHERE email = ?", normalizedEmail);
    
    if (sqliteUser) {
      isMatch = await bcrypt.compare(password, sqliteUser.password_hash);
      if (isMatch) {
        const userId = sqliteUser.mongo_id || sqliteUser.id.toString();
        const token = generateToken(userId);
        
        // If MongoDB became available and this SQLite user wasn't synced/found there, we could sync it later,
        // but for now, log them in using fallback credentials.
        const userObj = {
          id: userId,
          name: sqliteUser.name,
          email: sqliteUser.email,
          questionsCount: sqliteUser.questions_count,
          answersCount: sqliteUser.answers_count,
          reputation: sqliteUser.reputation,
          badges: sqliteUser.badges ? sqliteUser.badges.split(",").filter(Boolean) : [],
          storage: "sqlite"
        };
        return success(res, {
          storage: "sqlite",
          data: userObj,
          meta: { token, user: userObj }
        });
      }
    }

    return fail(res, {
      statusCode: 400,
      code: "INVALID_CREDENTIALS",
      message: "Invalid credentials"
    });
  } catch (error) {
    return fail(res, {
      statusCode: 500,
      code: "INTERNAL_SERVER_ERROR",
      message: "Login failed",
      details: error.message
    });
  }
});

// @route   GET api/auth/me
// @desc    Get user data
// @access  Private
router.get("/me", requireAuth, async (req, res) => {
  return success(res, {
    storage: req.user.storage || "mongodb",
    data: req.user,
    meta: { user: req.user }
  });
});

// @route   PATCH api/auth/me
// @desc    Update editable profile fields for the authenticated user
// @access  Private
//
// Accepts any subset of { name, bio, location }. Each field is validated
// for type and length. Updates are written to MongoDB when available AND
// mirrored to the SQLite fallback so both storages stay in sync, matching
// the storage-duality pattern used by /signup.
//
// Note: req.user from requireAuth does NOT yet include bio/location (the
// resolveUserById middleware still returns the original field set), so the
// response is built from { ...req.user, ...updates } to echo back the new
// values without requiring a fresh DB read.
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const { name, bio, location, username } = req.body || {};
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "" || name.length > 80) {
        return fail(res, {
          statusCode: 400,
          code: "VALIDATION_ERROR",
          message: "Name must be between 1 and 80 characters"
        });
      }
      updates.name = name.trim();
    }

    if (bio !== undefined) {
      if (typeof bio !== "string" || bio.length > 500) {
        return fail(res, {
          statusCode: 400,
          code: "VALIDATION_ERROR",
          message: "Bio must be 500 characters or fewer"
        });
      }
      updates.bio = bio;
    }

    if (location !== undefined) {
      if (typeof location !== "string" || location.length > 80) {
        return fail(res, {
          statusCode: 400,
          code: "VALIDATION_ERROR",
          message: "Location must be 80 characters or fewer"
        });
      }
      updates.location = location;
    }

    // Username is a separate editable display handle (distinct from `name`).
    // Validated for type + format + length, lowercased for storage, and
    // checked against other users so two accounts don't share a handle.
    if (username !== undefined) {
      if (typeof username !== "string") {
        return fail(res, {
          statusCode: 400,
          code: "VALIDATION_ERROR",
          message: "Username must be a string"
        });
      }
      const trimmedUsername = username.trim();
      if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
        return fail(res, {
          statusCode: 400,
          code: "VALIDATION_ERROR",
          message: "Username must be between 3 and 30 characters"
        });
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
        return fail(res, {
          statusCode: 400,
          code: "VALIDATION_ERROR",
          message: "Username can only contain letters, numbers, underscores, and dashes"
        });
      }
      const normalizedUsername = trimmedUsername.toLowerCase();
      const currentUsername = (req.user.username || "").toLowerCase();
      if (normalizedUsername !== currentUsername) {
        let conflict = false;
        if (isMongoAvailable()) {
          const existing = await User.findOne({
            username: normalizedUsername,
            _id: { $ne: req.user.id }
          });
          if (existing) conflict = true;
        } else {
          try {
            const db = getSQLiteDb();
            const existing = await db.get(
              `SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?`,
              normalizedUsername,
              req.user.sqliteId || 0
            );
            if (existing) conflict = true;
          } catch (sqLiteErr) {
            console.error("Failed to check username uniqueness in SQLite:", sqLiteErr.message);
          }
        }
        if (conflict) {
          return fail(res, {
            statusCode: 409,
            code: "USERNAME_TAKEN",
            message: "That username is already taken"
          });
        }
      }
      updates.username = normalizedUsername;
    }

    if (Object.keys(updates).length === 0) {
      return fail(res, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "No editable fields provided"
      });
    }

    // Mongo update (source of truth when available).
    if (isMongoAvailable()) {
      try {
        await User.findByIdAndUpdate(req.user.id, { $set: updates });
      } catch (mongoErr) {
        console.error("Mongo profile update failed:", mongoErr.message);
      }
    }

    // SQLite mirror. The row's identity depends on which storage resolved
    // the user: SQLite-only users are keyed by row id, Mongo users are
    // mirrored by mongo_id.
    try {
      const db = getSQLiteDb();
      const setClauses = [];
      const params = [];
      for (const [key, value] of Object.entries(updates)) {
        setClauses.push(`${key} = ?`);
        params.push(value);
      }
      const matchColumn = req.user.storage === "sqlite" ? "id" : "mongo_id";
      const matchValue =
        req.user.storage === "sqlite" ? req.user.sqliteId : req.user.id;
      params.push(matchValue);
      await db.run(
        `UPDATE users SET ${setClauses.join(", ")} WHERE ${matchColumn} = ?`,
        ...params
      );
    } catch (sqLiteErr) {
      console.error("Failed to sync profile update to SQLite:", sqLiteErr.message);
    }

    const freshUser = { ...req.user, ...updates };
    return success(res, {
      storage: req.user.storage || "mongodb",
      data: freshUser,
      meta: { user: freshUser }
    });
  } catch (error) {
    return fail(res, {
      statusCode: 500,
      code: "INTERNAL_SERVER_ERROR",
      message: "Profile update failed",
      details: error.message
    });
  }
});

module.exports = router;
