require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { connectMongo, isMongoAvailable } = require("./db/mongo");
const { connectSQLite } = require("./db/sqlite");
const { startSyncPipeline, runSyncPipeline } = require("./services/syncService");

const faqRoutes = require("./routes/faqRoutes");
const queryRoutes = require("./routes/queryRoutes");
const searchRoutes = require("./routes/searchRoutes");
const followRoutes = require("./routes/followRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const statsRoutes = require("./routes/statsRoutes");
const aiRoutes = require("./routes/aiRoutes");
const authRoutes = require("./routes/authRoutes");
const answerRoutes = require("./routes/answerRoutes");
const voteRoutes = require("./routes/voteRoutes");
const bookmarkRoutes = require("./routes/bookmarkRoutes");

const app = express();

app.use(cors());
app.use(express.json());

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

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mongoAvailable: isMongoAvailable(),
    fallback: "sqlite"
  });
});

app.use("/api/faqs", faqRoutes);
app.use("/api/queries", queryRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/answers", answerRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", aiRoutes);

async function bootstrap() {
  await connectSQLite();
  await connectMongo();

  await runSyncPipeline();
  startSyncPipeline();

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrap();