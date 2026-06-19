
# Prompt Template for CrowdFAQ Knowledge Platform

_Last updated: 2026-06-19_

## Project Summary

This repository implements CrowdFAQ, a crowdsourced FAQ and knowledge platform with:

- React + Vite frontend
- Express.js backend
- MongoDB primary storage
- SQLite fallback storage
- JWT authentication
- Background SQLite → MongoDB sync foundation
- Notifications, follows, bookmarks, votes, and activity stats
- AI quick summaries through Google Gemini
- OpenAPI/Swagger documentation
- Roadmap-driven feature tracking through `missing_features_roadmap.md`

Use this document when prompting an LLM to inspect, explain, modify, or extend the project.

---

## Mandatory Roadmap-Driven Workflow

Before implementing any new feature, fixing an incomplete feature, or modifying roadmap-related functionality, the LLM must retrieve and inspect these files in order:

1. `missing_features_roadmap.md`
2. `architecture.md`
3. `prompt-template.md`
4. Relevant frontend/backend/database files for the selected feature
5. `backend/openapi.yaml`, if public API routes are added or changed
6. `backend/tests/universal.postmerge.test.js`, if backend behavior changes

If `missing_features_roadmap.md` is unavailable, the LLM must stop and ask for it instead of guessing the missing-feature state.

If the original feasibility source is needed for re-comparison, retrieve the feasibility document used to generate the roadmap and compare it against the current codebase before changing statuses.

---

## Roadmap Implementation Rule

When asked to implement a missing or partial feature:

1. Identify the exact roadmap item from `missing_features_roadmap.md`.
2. Confirm its current status:
   - `Fully Complete`
   - `Partially Complete`
   - `Missing Backend`
   - `Missing Entirely`
   - `Planned / Roadmap Only`
3. Implement only the requested or explicitly scoped feature.
4. Do not attempt to implement all missing roadmap features in one pass.
5. Preserve existing production behavior.
6. Preserve MongoDB and SQLite fallback parity.
7. Add or update tests.
8. Update documentation after implementation.

A roadmap item must not be marked fully complete unless all required layers are implemented:

- Frontend UI or API client integration, when user-facing
- Backend route/service implementation
- MongoDB persistence, when persisted
- SQLite fallback persistence, when persisted
- Validation
- Authorization
- Tests
- Documentation updates

---

## Required Documentation Updates After Feature Work

After implementing, fixing, or removing any roadmap-related feature, update all relevant documentation.

### Always update `missing_features_roadmap.md`

For the affected feature, update:

- Current status
- Completed layers
- Remaining gaps
- Files changed
- New routes/services/models/tables
- Tests added or updated
- Date of update
- Whether the feature is now:
  - Fully complete
  - Still partial
  - Still missing backend
  - Deferred

Recommended roadmap entry format:

```markdown
## Feature Name

Status: Partially Complete
Priority: Phase 1
Difficulty: Medium
Source: FEASIBILITY DATA.pdf

Implemented Layers:
- Frontend: Complete
- Backend: Complete
- MongoDB: Complete
- SQLite: Complete
- Tests: Complete
- OpenAPI: Complete

Current Evidence:
- Added route: `PATCH /api/answers/:id/verify`
- Added Mongo fields on `Answer`
- Added SQLite migration for verification columns
- Added tests in `backend/tests/answer.verification.test.js`

Remaining Gaps:
- None

Last Updated:
- 2026-06-19
```

### Always update `architecture.md`

Update `architecture.md` when any feature changes the system architecture.

Include:

- Feature state movement:
  - Missing → Partial
  - Partial → Fully Complete
  - Fully Complete → Modified
- New backend routes
- New frontend API functions
- New services
- New MongoDB models or fields
- New SQLite tables, columns, or migrations
- New background jobs
- New auth/authorization rules
- New tests
- New environment variables, if any

### Update `prompt-template.md` only when needed

Update this file if:

- New major services are added
- New standard workflow rules are introduced
- New important prompt patterns are needed
- The roadmap process changes
- The codebase structure changes significantly

### Update `backend/openapi.yaml` when needed

Update OpenAPI docs when:

- A public endpoint is added
- A public endpoint changes request/response format
- A public endpoint is deprecated or removed

### Update tests when needed

Update or add tests when:

- A backend route changes
- A database schema changes
- Authorization behavior changes
- Validation behavior changes
- Sync/fallback behavior changes
- A roadmap item changes status

---

## Current Final Feature State

This section reflects the current known final state of the codebase. For the latest source of truth on missing and partial roadmap features, always inspect `missing_features_roadmap.md`.

### Fully Complete Across Frontend + Backend + Database

- Authentication: signup, login, JWT, `/api/auth/me`
- FAQ creation/listing/search/deletion authorization
- User query/question creation and pending/resolved lifecycle
- Answer submission and retrieval
- Voting
- Bookmarks / reading list
- Follows / subscriptions
- Basic notifications
- Activity graph data
- Heatmap data
- Admin overview
- Admin pending-query review
- SQLite fallback persistence
- MongoDB primary persistence
- SQLite → MongoDB sync foundation
- AI quick summaries
- REST API and Swagger docs

### Partially Complete

- Theme toggle: frontend-only unless backend preference sync is added
- Markdown/rich formatting: text storage exists; sanitization/rendering policy incomplete
- Required tagging: tags exist but are not mandatory everywhere
- Threaded answers: answer-to-question/query exists; nested answer replies missing
- Contribution streaks: event data exists; streak engine missing
- Badges/milestones: fields/UI exist; backend rule engine missing
- Leaderboard/community heroes: reputation fields/UI exist; backend leaderboard route missing
- Smart category cards: category data exists; trending/caching service missing
- Anonymous Q&A: anonymous fallback exists; full audit/permission model missing
- Personalized recommendations: UI direction exists; backend recommender missing
- Basic AI moderation: AI summary service exists; moderation service missing
- Search relevance tuning: basic search exists; advanced ranking missing
- Expert/SME recommendations: notification foundation exists; matching engine missing

### Missing Backend / Roadmap Features

- Expert verified answer workflow
- Version history
- Transparent diff viewer
- Rollback functionality
- Needs-update queue
- Still-relevant / decay scoring
- Refresher badge
- Multi-language FAQ support
- JSON/CSV/Markdown export
- PDF export
- Bulk import
- PDF/Word automatic thread generation
- Knowledge gap analyzer
- Knowledge gap analyzer with chatbot logs
- Bounty system
- Public GraphQL API
- AI translation + original toggle
- AI chatbot / RAG assistant
- Large-scale AI retrieval chatbot
- Advanced notifications
- NLP duplicate detection
- Similarity percentage scoring
- Why-flagged moderation explanations
- Tiered moderation review pipeline
- Personalized recommendations at scale

---

## Key Backend Files

### `backend/server.js`

Main Express app starter.

Responsibilities:

- Load middleware
- Register route modules
- Initialize SQLite and MongoDB outside test mode
- Start sync pipeline outside test mode
- Expose health endpoints
- Export app for tests

Mounted routes:

- `/api/faqs`
- `/api/queries`
- `/api/search`
- `/api/answers`
- `/api/votes`
- `/api/bookmarks`
- `/api/follows`
- `/api/notifications`
- `/api/admin`
- `/api/docs`
- `/api/stats`
- `/api/auth`
- `/api/summary`

### `backend/db/mongo.js`

- `connectMongo()`
- `isMongoAvailable()`

### `backend/db/sqlite.js`

- `connectSQLite()`
- `getSQLiteDb()`
- `closeSQLite()`
- Initializes fallback tables
- Runs migrations

### `backend/db/migrations/`

Contains SQLite schema migrations and indexes.

When adding persisted features, create an additive migration instead of editing already-applied migrations.

### `backend/routes/authRoutes.js`

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

### `backend/routes/faqRoutes.js`

- `GET /api/faqs`
- `POST /api/faqs`
- `DELETE /api/faqs/:id`

### `backend/routes/queryRoutes.js`

- `GET /api/queries`
- `POST /api/queries`
- `PATCH /api/queries/:id/resolve`
- `DELETE /api/queries/:id`

### `backend/routes/searchRoutes.js`

- `POST /api/search`

### `backend/routes/answerRoutes.js`

- `POST /api/answers`
- `GET /api/answers/query/:queryId`
- `GET /api/answers/:questionId`
- `DELETE /api/answers/:id`

### `backend/routes/voteRoutes.js`

- `POST /api/votes`

### `backend/routes/bookmarkRoutes.js`

- `POST /api/bookmarks`
- `GET /api/bookmarks`

### `backend/routes/followRoutes.js`

- `POST /api/follows`
- `DELETE /api/follows/:id`
- `PATCH /api/follows/:id/mute`

### `backend/routes/notificationRoutes.js`

- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read`
- `DELETE /api/notifications/:id`

### `backend/routes/statsRoutes.js`

- `GET /api/stats/activity`
- `GET /api/stats/heatmap`

### `backend/routes/adminRoutes.js`

- `GET /api/admin/pending-queries`
- `GET /api/admin/overview`

### `backend/routes/aiRoutes.js`

- `POST /api/summary`

### `backend/routes/docsRoutes.js`

- Serves Swagger UI from `openapi.yaml`

---

## Key Backend Middleware

### `backend/middleware/auth.js`

Provides:

- `optionalAuth()`
- `requireAuth()`
- `requireRole()`

Rules:

- Use `requireAuth()` for authenticated write actions.
- Use `requireRole("moderator", "admin")` or stricter for moderation/admin actions.
- Do not trust frontend role checks alone.

### `backend/middleware/validate.js`

Provides request validation integration.

Rules:

- Add validation schemas for every new write endpoint.
- Return standardized validation errors.

### `backend/middleware/ownership.js`

Provides ownership/admin helpers.

Rules:

- Use ownership checks for delete/update operations.
- Admin bypass must be explicit and tested.

### `backend/middleware/rateLimits.js`

Provides route-specific rate limiters.

Rules:

- Apply stricter rate limits to auth, AI, search, import, moderation, and chatbot routes.

---

## Key Backend Services

### Implemented

- `aiService.js`
- `categoryService.js`
- `eventService.js`
- `followService.js`
- `notificationService.js`
- `queueService.js`
- `syncService.js`

### To Add Later

- `badgeService.js`
- `leaderboardService.js`
- `revisionService.js`
- `diffService.js`
- `exportService.js`
- `importService.js`
- `moderationService.js`
- `duplicateDetectionService.js`
- `recommendationService.js`
- `knowledgeGapService.js`
- `chatRetrievalService.js`
- `translationService.js`
- `notificationPreferenceService.js`

When adding a new service:

1. Keep business logic out of route files where possible.
2. Add MongoDB and SQLite paths if the feature persists data.
3. Add tests for service-level edge cases.
4. Document the service in `architecture.md`.
5. Update `missing_features_roadmap.md`.

---

## Key Frontend Files

### `frontend/src/main.jsx`

Wraps app with:

- `BrowserRouter`
- `ThemeProvider`
- `AuthProvider`
- `FAQProvider`

### `frontend/src/App.jsx`

Defines app routes.

### `frontend/src/api/faqApi.js`

Centralized API client.

Important API functions include:

- FAQ/query fetch and mutation
- Search
- Answer submission/fetch
- Vote toggle
- Bookmark toggle/fetch
- Follow/unfollow/mute
- Notifications fetch/read/delete
- Stats fetch
- Admin overview/pending queries
- AI summary generation

When adding backend endpoints, add corresponding API client functions here before wiring UI components.

### `frontend/src/context/AuthContext.jsx`

Handles user auth state and token persistence.

### `frontend/src/context/FAQContext.jsx`

Handles FAQ/question/answer/bookmark/vote state.

### `frontend/src/context/ThemeContext.jsx`

Handles theme state.

---

## Database and Persistence Rules

CrowdFAQ uses MongoDB as the primary datastore and SQLite as the fallback datastore.

When adding persisted data:

1. Add or update the MongoDB model.
2. Add or update SQLite schema through a new migration.
3. Ensure fallback writes work when MongoDB is unavailable.
4. Ensure fallback reads work when MongoDB is unavailable.
5. Ensure sync behavior is considered.
6. Add tests that run without MongoDB.
7. Update `architecture.md`.
8. Update `missing_features_roadmap.md`.

Do not add a MongoDB-only persisted feature unless the roadmap explicitly marks SQLite support as intentionally deferred.

---

## Testing Rules

Backend tests use:

- Jest
- Supertest
- Isolated SQLite test databases
- MongoDB only when available

Important test file:

- `backend/tests/universal.postmerge.test.js`

When implementing a roadmap feature, add or update tests for:

- Success path
- Validation failure
- Authorization failure
- Ownership failure, if applicable
- SQLite fallback persistence
- MongoDB path, if practical
- Notification/event side effects, if applicable
- OpenAPI contract, if public API changed

Tests must remain deterministic and runnable without external AI calls.

Do not call Gemini or other external AI services in tests. Mock or bypass external calls.

---

## Recommended Prompt Patterns

### Explain an implemented workflow

```text
I am working on CrowdFAQ. First read architecture.md and prompt-template.md. Then trace the full flow for submitting a question from frontend/src/context/FAQContext.jsx through frontend/src/api/faqApi.js to backend/routes/queryRoutes.js, including MongoDB vs SQLite fallback behavior and event tracking.
```

### Compare codebase against roadmap

```text
Read missing_features_roadmap.md, architecture.md, and the relevant frontend/backend files. Compare the current codebase against the roadmap and classify each feature as fully complete, partially complete, missing backend, or missing entirely. Include exact files that would need to change.
```

### Safely add a new roadmap feature

```text
Read missing_features_roadmap.md first. Implement only the "Expert Verified Answer Badge" roadmap item. Preserve MongoDB/SQLite parity. Update the Answer Mongo model, SQLite migration, backend/routes/answerRoutes.js, event tracking, notification dispatch, tests, backend/openapi.yaml, architecture.md, and missing_features_roadmap.md.
```

### Add a roadmap feature without breaking current tests

```text
Read missing_features_roadmap.md first. Implement version history for FAQs only. Add revision storage for MongoDB and SQLite, create read routes, add tests for revision creation, update architecture.md and missing_features_roadmap.md, and ensure existing FAQ create/list/delete behavior still passes universal.postmerge.test.js.
```

### Update tests after a feature change

```text
Read missing_features_roadmap.md and architecture.md. Update backend/tests/universal.postmerge.test.js to cover the newly implemented feature while keeping the suite deterministic in SQLite fallback mode. Also update missing_features_roadmap.md to record the new test coverage.
```

### Implement a partial feature to completion

```text
Read missing_features_roadmap.md. Find the "Badges/Milestones" partial feature. Implement the smallest backend-complete version: badgeService.js, badge awarding after question/answer events, MongoDB and SQLite persistence, tests, and documentation updates. Do not implement streaks unless explicitly requested.
```

### Prevent over-implementation

```text
Read missing_features_roadmap.md. Implement only the requested endpoint and do not start unrelated roadmap items. If another missing feature is discovered, add it as a remaining gap in missing_features_roadmap.md instead of implementing it.
```

---

## Safe Editing Rules

When modifying the codebase:

1. Do not remove SQLite fallback support.
2. Do not add a persisted MongoDB feature without an SQLite equivalent.
3. Do not expose admin/moderator actions without `requireAuth` and `requireRole`.
4. Do not rely on Gemini or external AI calls in deterministic tests.
5. Keep tests runnable without MongoDB.
6. Update OpenAPI docs when adding public endpoints.
7. Update `architecture.md` for any implemented or changed feature.
8. Update `missing_features_roadmap.md` for any roadmap-related change.
9. Update `prompt-template.md` only when workflow guidance or major structure changes.
10. Add success, validation-failure, authorization-failure, and fallback tests.
11. Do not mark a feature fully complete unless frontend, backend, database, validation, authorization, and tests are complete where applicable.
12. Prefer additive migrations.
13. Avoid rewriting existing working modules unless necessary.
14. Keep route handlers thin and move reusable logic into services.
15. Maintain standardized API response envelopes.

---

## Roadmap Status Update Rules

When updating `missing_features_roadmap.md`, use these status definitions.

### Fully Complete

Use only when all applicable layers are complete:

- Frontend
- Backend
- MongoDB
- SQLite
- Validation
- Authorization
- Tests
- Documentation

### Partially Complete

Use when the feature exists in at least one meaningful layer but not all required layers.

Examples:

- Frontend exists, backend missing
- Backend route exists, database persistence missing
- Database fields exist, service/workflow missing
- Basic implementation exists, but authorization/tests are missing

### Missing Backend

Use when frontend/UI or product direction exists, but there is no sufficient backend route/service/workflow.

### Missing Entirely

Use when the feature is not meaningfully implemented in frontend, backend, or database.

### Planned / Roadmap Only

Use when the feature is intentionally not implemented yet and should not have exposed routes.

---

## Final Instruction for LLMs

When working on CrowdFAQ:

1. Read `missing_features_roadmap.md` before any roadmap-related implementation.
2. Read `architecture.md` before making architectural changes.
3. Implement only the scoped feature.
4. Preserve MongoDB/SQLite parity.
5. Add or update tests.
6. Update `missing_features_roadmap.md`.
7. Update `architecture.md`.
8. Update `backend/openapi.yaml` if public APIs changed.
9. Do not claim a feature is complete unless all required layers and tests are complete.
