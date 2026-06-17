const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const User = require("../models/User");
const authenticateUser = require("../middleware/auth");

// JWT signature function
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "crowdfaq_secret_key_12345", {
    expiresIn: "7d"
  });
};

// @route   POST api/auth/signup
// @desc    Register a user
// @access  Public
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || name.trim() === "" || !email || email.trim() === "" || !password || password.trim() === "") {
      return res.status(400).json({ error: "Please enter all fields" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
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
      return res.status(400).json({ error: "User already exists with this email" });
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
        password: passwordHash
      });

      userId = newUser._id.toString();
      savedUser = {
        id: userId,
        name: newUser.name,
        email: newUser.email,
        questionsCount: 0,
        answersCount: 0,
        reputation: 0,
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
        storage: "sqlite"
      };
    }

    // Generate JWT
    const token = generateToken(userId);

    res.status(201).json({
      token,
      user: savedUser
    });
  } catch (error) {
    res.status(500).json({
      error: "Signup failed",
      details: error.message
    });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || email.trim() === "" || !password || password.trim() === "") {
      return res.status(400).json({ error: "Please enter all fields" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user = null;
    let isMatch = false;

    if (isMongoAvailable()) {
      user = await User.findOne({ email: normalizedEmail });
      if (user) {
        isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          if (user.isSuspended) {
            return res.status(403).json({ error: "Your account is suspended." });
          }
          const token = generateToken(user._id.toString());
          return res.json({
            token,
            user: {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role || "user",
              isSuspended: user.isSuspended,
              questionsCount: user.questionsCount,
              answersCount: user.answersCount,
              reputation: user.reputation,
              storage: "mongodb"
            }
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
        if (sqliteUser.is_suspended) {
          return res.status(403).json({ error: "Your account is suspended." });
        }
        const userId = sqliteUser.mongo_id || sqliteUser.id.toString();
        const token = generateToken(userId);
        
        return res.json({
          token,
          user: {
            id: userId,
            name: sqliteUser.name,
            email: sqliteUser.email,
            role: sqliteUser.role || "user",
            isSuspended: Boolean(sqliteUser.is_suspended),
            questionsCount: sqliteUser.questions_count,
            answersCount: sqliteUser.answers_count,
            reputation: sqliteUser.reputation,
            storage: "sqlite"
          }
        });
      }
    }

    return res.status(400).json({ error: "Invalid credentials" });
  } catch (error) {
    res.status(500).json({
      error: "Login failed",
      details: error.message
    });
  }
});

// @route   POST api/auth/google
// @desc    Google Sign-In callback verification
// @access  Public
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: "Google credentials are required" });
    }

    // Verify token using Google tokeninfo API
    let payload = null;
    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (response.ok) {
        payload = await response.json();
      } else {
        throw new Error("Token verification failed at Google");
      }
    } catch (err) {
      console.warn("Google tokeninfo verify failed, attempting local mock fallback...", err.message);
    }

    // If payload couldn't be fetched, check for mock token for offline local testing
    if (!payload) {
      if (typeof credential === "string" && credential.startsWith("mock-google-token-")) {
        const username = credential.replace("mock-google-token-", "");
        const mockEmail = username + "@gmail.com";
        const mockName = username.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        payload = {
          email: mockEmail,
          name: mockName,
          sub: "mock-google-sub-" + mockEmail
        };
      } else {
        return res.status(400).json({ error: "Invalid Google credential token or network error" });
      }
    }

    const email = payload.email.toLowerCase().trim();
    const name = payload.name || "Google User";
    
    let user = null;
    let userId = null;

    if (isMongoAvailable()) {
      user = await User.findOne({ email });
      if (user) {
        if (user.isSuspended) {
          return res.status(403).json({ error: "Your account is suspended." });
        }
        userId = user._id.toString();
      } else {
        const salt = await bcrypt.genSalt(10);
        const dummyPassword = await bcrypt.hash(Math.random().toString(36), salt);
        user = await User.create({
          name,
          email,
          password: dummyPassword,
          role: "user"
        });
        userId = user._id.toString();

        try {
          const db = getSQLiteDb();
          await db.run(
            `INSERT INTO users (mongo_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, 'user')`,
            userId, name, email, dummyPassword
          );
        } catch (sqLiteErr) {
          console.error("Failed to sync new Google user to SQLite:", sqLiteErr.message);
        }
      }

      const token = generateToken(userId);
      return res.json({
        token,
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          role: user.role || "user",
          isSuspended: user.isSuspended,
          questionsCount: user.questionsCount || 0,
          answersCount: user.answersCount || 0,
          reputation: user.reputation || 0,
          storage: "mongodb"
        }
      });
    }

    // SQLite Fallback path
    const db = getSQLiteDb();
    const sqliteUser = await db.get("SELECT * FROM users WHERE email = ?", email);
    let finalUser = null;

    if (sqliteUser) {
      if (sqliteUser.is_suspended) {
        return res.status(403).json({ error: "Your account is suspended." });
      }
      userId = sqliteUser.mongo_id || sqliteUser.id.toString();
      finalUser = {
        id: userId,
        name: sqliteUser.name,
        email: sqliteUser.email,
        role: sqliteUser.role || "user",
        isSuspended: Boolean(sqliteUser.is_suspended),
        questionsCount: sqliteUser.questions_count,
        answersCount: sqliteUser.answers_count,
        reputation: sqliteUser.reputation,
        storage: "sqlite"
      };
    } else {
      const salt = await bcrypt.genSalt(10);
      const dummyPassword = await bcrypt.hash(Math.random().toString(36), salt);
      const result = await db.run(
        `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'user')`,
        name, email, dummyPassword
      );
      userId = result.lastID.toString();
      finalUser = {
        id: userId,
        name,
        email,
        role: "user",
        isSuspended: false,
        questionsCount: 0,
        answersCount: 0,
        reputation: 0,
        storage: "sqlite"
      };
    }

    const token = generateToken(userId);
    return res.json({
      token,
      user: finalUser
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ error: "Google authentication failed", details: error.message });
  }
});

// @route   GET api/auth/me
// @desc    Get user data
// @access  Private
router.get("/me", authenticateUser, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
