# Architecture Overview: CrowdFAQ Knowledge Platform

_Last updated: 2026-06-19_

## 1. High-Level System Overview

CrowdFAQ is a full-stack FAQ crowdsourcing and knowledge-sharing platform built with:

- **Frontend:** React + Vite
- **Backend:** Express.js
- **Primary datastore:** MongoDB via Mongoose
- **Fallback datastore:** SQLite
- **Authentication:** JWT
- **Background sync:** SQLite → MongoDB
- **AI assist:** Google Gemini via `@google/genai`
- **API documentation:** OpenAPI YAML served through Swagger UI

The system is designed to remain functional when MongoDB is unavailable. In degraded mode, reads and writes use SQLite fallback tables. When MongoDB becomes available again, the sync pipeline can migrate fallback records to the primary store.

---

## 2. Final Implemented Feature State

### 2.1 Fully Implemented Across Frontend, Backend, and Database

The current codebase fully supports these platform features end-to-end:

- User signup, login, JWT authentication, and authenticated profile lookup.
- FAQ creation, listing, search, and deletion authorization.
- User query/question submission and pending/resolved lifecycle.
- Answer submission and answer retrieval for FAQs and user queries.
- Voting on questions/answers (score counters, state highlights).
- Bookmarking / reading list.
- Following questions/tags.
- Basic notifications list (read/unread toggles and deletion).
- Activity stats and heatmap stats dashboard.
- Admin overview statistics and pending-query review.
- MongoDB primary persistence.
- SQLite fallback persistence.
- SQLite → MongoDB background sync pipeline.
- AI-generated quick summaries on FAQ details.
- Public REST API surface with OpenAPI documentation.
- Content moderation: AI content scoring for spam/toxicity, moderator review queue, and explanations.
- NLP duplicate detection and similarity checking when posting questions.
- Search analytics aggregation and admin knowledge gap clustering.
- RAG AI Chatbot assistant with matching FAQ citations.
- FAQ translations storage and auto-translation request paths (English, Spanish, French, German).
- Public GraphQL API with matched REST auth rules.
- Reputation bounty creation and reward system for questions.
- User notification delivery preferences center (email, in-app, digest frequency, tag alerts).

### 2.2 Partially Implemented Features (Backend-Complete, Frontend-Missing/Mocked)

These features have fully implemented backend services, database schemas, validation schemas, and unit tests, but are incomplete or mocked on the frontend:

- **Required Tagging:** Tag fields exist and are validated as required (length >= 1) on the backend via Zod schemas, but the frontend form does not enforce validation checks or offer tag suggestions before submission.
- **Expert Verified Answer Badge:** Verification routes (`PATCH /api/answers/:id/verify`), database schema updates, and events exist on the backend, but the frontend detail view does not render verification badges or moderator buttons.
- **Badge and Milestone Engine:** Rule-based achievements (e.g. first question, first answer, streak multipliers, reputation milestones) are tracked by `badgeService.js` on the backend, but the frontend profile displays static mock badges.
- **Leaderboard API:** Route `/api/contributors/leaderboard` returns ranked contributors, but the frontend Contributors page uses a static context list.
- **Version History & Rollback:** Revision tables/schemas (`faq_revisions`, `query_revisions`, `answer_revisions`) and rollback operations exist on the backend, but no revision history panels or rollback buttons exist in the UI.
- **Diff Viewer:** Server revisions comparisons are prepared on the backend, but there is no comparative diff rendering component on the frontend.
- **Relevance Decay & Needs-Update Queue:** Automatic stale-FAQ flagging and decay calculations are done by `decayService.js` and `/api/admin/needs-update` endpoint, but the frontend admin page only lists stale FAQs under knowledge gaps (no dedicated queue tab or "Still relevant?" feedback triggers).
- **Offline Exports (JSON, CSV, Markdown, PDF):** Fully complete streaming exporters (`exportService.js` and `pdfkit`) are available on the backend, but no export buttons are present on the frontend UI.
- **Bulk FAQ Import:** Upload routing and CSV/JSON/Markdown parsers (`importService.js`) are complete on the backend, but no import triggers exist on the frontend.
- **Automatic Thread Generation:** Gemini-driven structures extraction from PDF/Word is complete on the backend (`/api/faqs/generate-thread`), but no document upload component is integrated.
- **Personalized FAQ Recommendations:** scoring algorithms (`recommendationService.js`) exist on the backend, but the frontend subscriptions page renders static recommendations.
- **Related Learning Paths:** Database schemas and routes (`/api/learning-paths`) are complete on the backend, but the frontend has no learning paths page or path creator.
- **User Learning Journey Dashboard:** Route `/api/stats/journey` aggregates views and topic coverage on the backend, but the user profile lacks dashboard visualizations.
- **Theme Toggle:** Frontend-complete; no backend user-preference sync is implemented yet.
- **Rich Formatting / Markdown:** Text fields exist; no explicit backend sanitization or rendering policy is set.
- **Threaded Answers:** Answers attach to a FAQ or query, but nested parent-child answer threads are not supported.
- **Contribution Streaks:** Event history is parsed in `badgeService.js` to calculate consecutive activity days, but no dedicated streak service exists.
- **Smart Category Cards:** Categories exist, but no trending or cached category metrics are tracked.
- **Anonymous Q&A Mode:** Anonymous fallback exists, but not a full audited anonymous-mode workflow.
- **Expert Recommendation / SME Notification:** Notification foundation exists, but no expert matching engine is in place.

---

## 3. Core Layers

### 3.1 Frontend Layer

Important frontend entry points:

- `frontend/src/main.jsx`
  - Bootstraps React, wraps app in `BrowserRouter`, `ThemeProvider`, `AuthProvider`, and `FAQProvider`.
- `frontend/src/App.jsx`
  - Defines routing and mounts the floating AI `ChatWidget`.
- `frontend/src/api/faqApi.js`
  - Central HTTP request library. Communicates with REST endpoints, attaches JWT tokens, and handles retry wrappers.
- `frontend/src/context/AuthContext.jsx`
  - Handles login, registration, logout, and `/api/auth/me` user data fetches.
- `frontend/src/context/FAQContext.jsx`
  - Handles FAQ, question, query, bookmark, voting, and notification local state syncing.

### 3.2 Backend Layer

Main backend entry point:

- `backend/server.js`
  - Configures Express, middleware (helmet, compression, cors, rate-limiters, optionalAuth), and registers the route modules.

Registered route modules:

- `/api/faqs` -> FAQ creation, listings, deletion, translations, and staleness updates.
- `/api/queries` -> Submission of user questions, query life cycles, and resolution actions.
- `/api/search` -> Relevance-tuned keyword search.
- `/api/answers` -> Answer posting, retrieval, deletion, verification, and revisions history.
- `/api/votes` -> Votes toggling on questions and answers.
- `/api/bookmarks` -> User bookmark toggles and lists.
- `/api/follows` -> Follow/unfollow tags and questions, notification muting.
- `/api/notifications` -> User notifications indexing, mark-as-read, and deletion.
- `/api/admin` -> Moderator queue review, health summaries, moderation logs, AI explanations, and knowledge gaps.
- `/api/docs` -> Swagger UI renderer for `openapi.yaml`.
- `/api/stats` -> Heatmap, activity, and learning journey metrics.
- `/api/auth` -> Signup, login, profile resolution.
- `/api/contributors` -> Top contributors leaderboard queries.
- `/api/export` -> JSON, CSV, Markdown, and PDF streaming compiler.
- `/api/recommendations` -> User-personalized content suggestions.
- `/api/learning-paths` -> Curated FAQ learning path compiler.
- `/api/duplicates` -> AI/NLP text similarity checkers.
- `/api/chat` -> Conversational RAG assistant.
- `/api/graphql` -> GraphQL API schema and resolvers.
- `/api/bounties` -> Reputation bounty sponsoring and awarding.
- `/api` (AI routes) -> AI summary generation.

---

## 4. Data Storage and Fallback Strategy

### 4.1 MongoDB Primary Store

MongoDB is used when `isMongoAvailable()` returns true. Schema models are declared under `backend/models/`.

### 4.2 SQLite Fallback Store

SQLite fallback is initialized by `backend/db/sqlite.js`. Database tables are configured via SQL migration scripts inside `backend/db/migrations/` and run by `runMigrations.js` on boot. 

The fallback tables mirror the primary MongoDB collections to enable seamless degraded mode operation.

---

## 5. Route Responsibilities

### 5.1 Authentication (`backend/routes/authRoutes.js`)
- `POST /api/auth/signup` / `POST /api/auth/login` / `GET /api/auth/me`

### 5.2 FAQ Routes (`backend/routes/faqRoutes.js`)
- `GET /api/faqs` / `POST /api/faqs` / `DELETE /api/faqs/:id`
- `POST /api/faqs/:id/translations` / `GET /api/faqs/:id/translations`
- `PATCH /api/faqs/:id/reviewed` / `POST /api/faqs/:id/flag-stale`
- `GET /api/faqs/:id/revisions` / `POST /api/faqs/:id/revisions/:revisionId/rollback`

### 5.3 Query Routes (`backend/routes/queryRoutes.js`)
- `GET /api/queries` / `POST /api/queries` / `PATCH /api/queries/:id/resolve` / `DELETE /api/queries/:id`
- `GET /api/queries/:id/revisions`

### 5.4 Answer Routes (`backend/routes/answerRoutes.js`)
- `POST /api/answers` / `GET /api/answers/:questionId` / `DELETE /api/answers/:id`
- `PATCH /api/answers/:id/verify`
- `GET /api/answers/:id/revisions` / `POST /api/answers/:id/revisions/:revisionId/rollback`

### 5.5 Vote Routes (`backend/routes/voteRoutes.js`)
- `POST /api/votes` (toggles vote metrics on targets).

### 5.6 Bookmark Routes (`backend/routes/bookmarkRoutes.js`)
- `POST /api/bookmarks` / `GET /api/bookmarks`

### 5.7 Follow Routes (`backend/routes/followRoutes.js`)
- `POST /api/follows` / `DELETE /api/follows/:id` / `PATCH /api/follows/:id/mute`

### 5.8 Notification Routes (`backend/routes/notificationRoutes.js`)
- `GET /api/notifications` / `PATCH /api/notifications/:id/read` / `PATCH /api/notifications/read` / `DELETE /api/notifications/:id`
- `GET /api/notifications/preferences` / `PUT /api/notifications/preferences`

### 5.9 Stats Routes (`backend/routes/statsRoutes.js`)
- `GET /api/stats/activity` / `GET /api/stats/heatmap` / `GET /api/stats/journey`

### 5.10 Admin Routes (`backend/routes/adminRoutes.js`)
- `GET /api/admin/overview` / `GET /api/admin/pending-queries` / `GET /api/admin/needs-update`
- `GET /api/admin/moderation-queue` / `GET /api/admin/moderation/:id/explanation` / `PATCH /api/admin/moderation/:id/action`
- `GET /api/admin/knowledge-gaps`

### 5.11 AI Routes (`backend/routes/aiRoutes.js`)
- `POST /api/summary` (FAQ details quick summary)

### 5.12 Docs Routes (`backend/routes/docsRoutes.js`)
- `GET /api/docs` (Swagger UI integration)

### 5.13 Contributor Routes (`backend/routes/contributorRoutes.js`)
- `GET /api/contributors/leaderboard` (Index of top contributors)

### 5.14 Export Routes (`backend/routes/exportRoutes.js`)
- `GET /api/export` (Streams data out as JSON, CSV, Markdown, or PDF)

### 5.15 Recommendation Routes (`backend/routes/recommendationRoutes.js`)
- `GET /api/recommendations/faqs` (Personalized suggestions lists)

### 5.16 Learning Path Routes (`backend/routes/learningPathRoutes.js`)
- `GET /api/learning-paths` / `GET /api/learning-paths/:id` / `POST /api/learning-paths`

### 5.17 Duplicate Routes (`backend/routes/duplicateRoutes.js`)
- `POST /api/duplicates/check` (NLP similarity scanning)

### 5.18 Chat Routes (`backend/routes/chatRoutes.js`)
- `POST /api/chat` (AI Conversational Chat widget endpoint)

### 5.19 GraphQL Routes (`backend/routes/graphqlRoutes.js`)
- `POST /api/graphql` (GraphQL schema endpoints)

### 5.20 Bounty Routes (`backend/routes/bountyRoutes.js`)
- `GET /api/bounties` / `POST /api/bounties` / `POST /api/bounties/:id/award`

---

## 6. Services

### Implemented Services

- `aiService.js` -> Handles direct summarization requests using Google Gemini APIs.
- `badgeService.js` -> Computes milestone rules and awards achievements to users.
- `categoryService.js` -> Infers categories based on keywords and normalizes tags.
- `chatRetrievalService.js` -> Manages RAG searches and retrieves chatbot context citations.
- `decayService.js` -> Calculates stale scores and flags outdated FAQs.
- `duplicateDetectionService.js` -> Computes Jaccard text overlaps and runs semantic duplicate checks.
- `eventService.js` -> Dispatches telemetry events for dashboard metrics.
- `exportService.js` -> Formats databases collections into streams of files.
- `followService.js` -> Dispatches following notifications and matches follower targets.
- `importService.js` -> Parses CSV/JSON/Markdown imports and translates raw document files into structured FAQs using Gemini.
- `moderationService.js` -> Performs toxicity audits and updates queues.
- `notificationService.js` -> Resolves delivery configurations and formats target messages.
- `queueService.js` -> Manages synchronous memory buffers.
- `recommendationService.js` -> Generates user-specific scoring metrics based on interactions.
- `revisionService.js` -> Logs revisions histories and performs rollback merges.
- `syncService.js` -> Performs scheduled SQLite fallback to MongoDB schema data migration.
- `translationService.js` -> Automates translations storage.

### Missing Roadmap Services

Future iterations can introduce:
- `diffService.js` -> (If complex text diff highlights are moved from frontend client services).
- `leaderboardService.js` -> (If leaderboard calculations require a dedicated cached ranking engine).

---

## 7. Testing Strategy

Current backend test strategy uses:

- **Jest** and **Supertest**
- Isolated SQLite test databases
- MongoDB only when available (tests remain runnable and pass successfully without a MongoDB connection)

Universal post-merge check suite:
- `backend/tests/universal.postmerge.test.js`

Features are tested across both success, validation failure, authorization failure, and fallback database persistence paths.

---

## 8. Developer Onboarding Summary

To understand the codebase layout:
1. Start with `backend/server.js` and trace mounted routes in `backend/routes/`.
2. Inspect `backend/db/sqlite.js` and SQLite migrations.
3. Review middleware rules (auth, validate, ownership).
4. For business logic, inspect `backend/services/`.
5. On the frontend, trace routes from `frontend/src/App.jsx` and read API functions inside `frontend/src/api/faqApi.js`.
