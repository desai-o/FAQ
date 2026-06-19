require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8"]);
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const mongoose = require("mongoose");
const { connectMongo, isMongoAvailable } = require("./db/mongo");
const { connectSQLite, getSQLiteDb, closeSQLite } = require("./db/sqlite");
const { startSyncPipeline, enqueueSyncPipeline } = require("./services/syncService");
const { getQueueSize } = require("./services/queueService");

const faqRoutes = require("./routes/faqRoutes");
const queryRoutes = require("./routes/queryRoutes");
const searchRoutes = require("./routes/searchRoutes");
const followRoutes = require("./routes/followRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const statsRoutes = require("./routes/statsRoutes");
const aiRoutes = require("./routes/aiRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const answerRoutes = require("./routes/answerRoutes");
const voteRoutes = require("./routes/voteRoutes");
const bookmarkRoutes = require("./routes/bookmarkRoutes");
const docsRoutes = require("./routes/docsRoutes");
const contributorRoutes = require("./routes/contributorRoutes");
const exportRoutes = require("./routes/exportRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const learningPathRoutes = require("./routes/learningPathRoutes");
const duplicateRoutes = require("./routes/duplicateRoutes");
const chatRoutes = require("./routes/chatRoutes");
const graphqlRoutes = require("./routes/graphqlRoutes");
const bountyRoutes = require("./routes/bountyRoutes");
const { optionalAuth } = require("./middleware/auth");


const app = express();

app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
  })
);

app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
    max: Number(process.env.RATE_LIMIT_MAX || 300),
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use(
  express.json({
    limit: "1mb"
  })
);
app.use(optionalAuth);

app.get("/", (req, res) => {
  res.json({
    message: "Crowdsourced FAQ backend is running",
    stack: "MERN",
    primaryStore: "MongoDB",
    fallbackStore: "SQLite",
    mongoAvailable: isMongoAvailable(),
    endpoints: {
      health: "GET /health",
      faqs: "GET /api/faqs",
      createFaq: "POST /api/faqs",
      queries: "GET /api/queries",
      submitQuery: "POST /api/queries",
      resolveQuery: "PATCH /api/queries/:id/resolve",
      search: "POST /api/search"
    }
  });
});

app.get("/health", async (req, res) => {
  let sqliteAvailable = false;

  try {
    const db = getSQLiteDb();
    await db.get("SELECT 1 AS ok");
    sqliteAvailable = true;
  } catch (error) {
    sqliteAvailable = false;
  }

  res.json({
    status: sqliteAvailable ? "ok" : "degraded",
    mongoAvailable: isMongoAvailable(),
    sqliteAvailable,
    fallback: "sqlite",
    queueSize: getQueueSize()
  });
});

app.get("/health/queue", (req, res) => {
  res.json({
    status: "ok",
    queueSize: getQueueSize()
  });
});

app.use("/api/faqs", faqRoutes);
app.use("/api/queries", queryRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/answers", answerRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/docs", docsRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/contributors", contributorRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/learning-paths", learningPathRoutes);
app.use("/api/duplicates", duplicateRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/graphql", graphqlRoutes);
app.use("/api/bounties", bountyRoutes);
app.use("/api", aiRoutes);


app.use(notFound);
app.use(errorHandler);

async function bootstrap() {
  await connectSQLite();
  await connectMongo();

  enqueueSyncPipeline();
  startSyncPipeline();

  const PORT = process.env.PORT || 5000;

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  async function shutdown(signal) {
    console.log(`${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      try {
        await closeSQLite();

        if (mongoose.connection.readyState !== 0) {
          await mongoose.connection.close();
        }

        console.log("Database connections closed");
        process.exit(0);
      } catch (error) {
        console.error("Graceful shutdown failed:", {
          message: error.message,
          stack: process.env.NODE_ENV === "production" ? undefined : error.stack
        });
        process.exit(1);
      }
    });
  }

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

if (process.env.NODE_ENV !== "test") {
  bootstrap().catch((error) => {
    console.error("Backend bootstrap failed:", {
      message: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack
    });
    process.exit(1);
  });
}

module.exports = app;