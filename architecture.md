# Architecture Overview: CrowdFAQ Knowledge Platform

_Last updated: 2026-06-19_

## 1. Executive Summary

CrowdFAQ is a full-stack FAQ and knowledge-platform application. The current iteration has evolved from a basic FAQ crowdsourcing app into a broad knowledge-management platform with:

- React + Vite frontend
- Express.js backend
- MongoDB primary datastore
- SQLite fallback datastore
- JWT authentication
- Runtime fallback when MongoDB is unavailable
- SQLite → MongoDB sync foundation
- REST API surface with OpenAPI/Swagger documentation
- AI-assisted features through Google Gemini integration
- Advanced backend modules for moderation, duplicate detection, exports/imports, recommendations, translations, learning paths, bounties, GraphQL, notification preferences, and RAG-style chat

The backend is currently ahead of the frontend. Most advanced platform capabilities are represented in backend routes, services, models, and SQLite fallback schema. The frontend covers the core product experience and several advanced UI surfaces, but some backend-complete features still need final UI wiring, while several upcoming UI enhancements are intentionally frontend-only prototypes with no backend/database integration yet.

The current engineering phase is a **controlled frontend integration and frontend-only UI sprint**. Backend feature expansion should be avoided unless explicitly requested.

---

## 2. Current Implementation State

### 2.1 Fully Implemented Core Platform Features

The current codebase supports these core platform capabilities:

- Authentication: signup, login, JWT issuance, authenticated profile lookup
- FAQ creation, listing, search, deletion authorization, and storage
- User query/question submission and pending/resolved lifecycle
- Answer submission and retrieval for FAQs and user queries
- Voting on questions and answers
- Bookmarks / reading list
- Following questions and tags
- Basic notifications with read/delete operations
- Activity statistics and heatmap statistics
- Admin overview and pending-query review
- MongoDB primary persistence
- SQLite fallback persistence
- SQLite schema migrations
- SQLite → MongoDB sync foundation
- AI-generated quick summaries
- REST API documentation through Swagger/OpenAPI baseline

### 2.2 Backend-Implemented Advanced Features

The backend contains routes, services, models, and/or SQLite schema for these advanced capabilities:

- Expert answer verification fields and route support
- Badge and milestone service foundation
- Contributor leaderboard route
- FAQ/query/answer revision models and rollback/revision support
- Relevance decay and needs-update backend fields/services
- Export service for JSON, CSV, Markdown, and PDF-style outputs
- Import service for JSON/CSV/Markdown and document/thread generation workflows
- Personalized FAQ recommendation service
- Learning path models and routes
- User learning journey statistics route
- AI moderation service and moderation records
- Duplicate detection and similarity records
- Search analytics and knowledge gap aggregation
- Chat/RAG-style assistant route and chat log model
- FAQ translations and translation model/table
- GraphQL route
- Bounty system model/routes
- Notification preferences model/routes

### 2.3 Frontend-Implemented / Partially Integrated Features

The frontend includes:

- React + Vite SPA structure
- `AuthContext`, `FAQContext`, and `ThemeContext`
- Landing page and app routing
- Dashboard, Questions, Question Detail, Categories, Contributors, Bookmarks, Profile, Admin, Login, Signup, and Subscription pages
- Chat widget component
- Activity graph and community heatmap components
- Notification preferences component
- Profile badge/profile analytics components
- Protected route handling
- API abstraction in `frontend/src/api/faqApi.js`
- Local/fallback state handling for some flows
- Responsive styling, dark/light theme support, dashboard/admin layouts, and polished landing/widget UI
- Advanced Search UI filter panel prototype (category, tag, sort, and status filtering client-side)

Several newer backend-complete features still need final frontend wiring or replacement of static/mock UI data.

### 2.4 Current Sprint Scope

The active sprint focuses on two types of frontend work.

#### Backend-Integrated Frontend Work

These features may use existing backend APIs:

1. Contributor leaderboard API integration
2. Export options
3. Import option with AI-powered cleanup/preview
4. Translation controls
5. Bounty UI with reputation link
6. Learning paths
7. Backend-powered recommendations
8. Notification preferences persistence
9. Revision history and rollback UI
10. Admin needs-update queue

#### Frontend-Only UI Prototypes

These features must remain UI-only unless backend/database work is explicitly approved:

1. Edit UI for FAQ, Query, and Answers
2. Whole moderation dashboard and controls prototype
3. Advanced search UI: category filters, tag filters, sort by newest, sort by votes [PROTOTYPE COMPLETE]
4. Related questions sidebar
5. Separate FAQ vs Questions section
6. Badges/milestone progress bar or meter based on reputation increments
7. Notifications UI improvement
8. Subscription thread controls and search filters
9. Profile page activity visualization
10. Verified/expert badges on answers by expert-classified users
11. Notification filters: new, old, answers only, questions followed, flags/warnings
12. Per-question/per-answer translation UI prototype if not using backend translation routes

Frontend-only items must not add backend routes, database migrations, Mongoose models, SQLite schema changes, sync changes, or new persistence behavior.

---

## 3. Design and Frontend Styling Source of Truth

The primary frontend design and styling guide for this sprint is:

```text
frontend-sample.txt
```

Frontend implementation should use `frontend-sample.txt` for:

- layout patterns
- spacing and density
- dashboard/admin visual structure
- cards, chips, badges, tabs, filters, and panels
- empty/loading/error states
- responsive behavior
- dark/light theme behavior
- micro-interactions and visual polish

If `frontend-sample.txt` is unavailable, frontend implementation should pause until it is provided.

---

## 4. Frontend Layer

### 4.1 Key Files

- `frontend/src/main.jsx`
  - Bootstraps React.
  - Wraps the app with router/providers.

- `frontend/src/App.jsx`
  - Defines frontend page routing.
  - Mounts major page-level components.

- `frontend/src/api/faqApi.js`
  - Centralized API client.
  - Handles backend requests, JWT headers, retries/timeouts where implemented, and response parsing.
  - Should be updated before wiring UI to new backend endpoints.
  - Should separate normal JSON helpers from raw export/download helpers.

- `frontend/src/context/AuthContext.jsx`
  - Handles login, signup, logout, token persistence, and profile fetch.

- `frontend/src/context/FAQContext.jsx`
  - Handles FAQ/question/answer/vote/bookmark state and backend synchronization.

- `frontend/src/context/ThemeContext.jsx`
  - Handles frontend theme state.

### 4.3 Frontend Question Feed Normalization

The frontend Questions experience renders a normalized union of:
- backend FAQs from `/api/faqs`,
- backend user queries from `/api/queries`,
- local unsynced questions from `crowdfaq_unsynced_questions`.

This prevents submitted questions from disappearing after reload when the backend stores open questions in `user_queries` but resolved knowledge entries in `faqs`.

### 4.2 Frontend Pages

- `Admin.jsx`
- `Bookmarks.jsx`
- `Categories.jsx`
- `Contributors.jsx`
- `Dashboard.jsx`
- `Landing.jsx`
- `Login.jsx`
- `Profile.jsx`
- `QuestionDetail.jsx`
- `Questions.jsx`
- `Signup.jsx`
- `Subscription.jsx`

Potential upcoming pages/components:

- `LearningPaths.jsx`
- `LearningPathDetail.jsx`
- `ExportPanel.jsx`
- `ImportPanel.jsx`
- `RevisionHistoryPanel.jsx`
- `NeedsUpdateQueue.jsx`
- `BountyPanel.jsx`
- `RelatedQuestionsSidebar.jsx`
- `ModerationDashboard.jsx`
- `ActivityVisualization.jsx`

### 4.3 Important Components

- `ActivityGraph.jsx`
- `AskQuestionModal.jsx`
- `ChatWidget.jsx`
- `CommunityHeatmap.jsx`
- `ErrorToast.jsx`
- `Hashtag.jsx`
- `NotificationPreferences.jsx`
- `ProfileDropdown.jsx`
- `ProtectedRoute.jsx`
- `Sidebar.jsx`
- `StatsGrid.jsx`
- `Topbar.jsx`
- `TrendingQuestion.jsx`
- `TrendingQuestions.jsx`
- Profile components under `frontend/src/components/profile/`

### 4.4 Frontend Integration Principles

- Use `faqApi.js` for all backend calls.
- Keep mock/static data only as fallback when backend routes exist.
- Add loading, empty, error, and success states for each API-backed feature.
- Add role-gated controls for admin/moderator actions.
- Keep frontend-only prototypes local-state/mock-data based until backend integration is approved.
- Update `missing-features-roadmap.md` after each integration.

---

## 5. Backend Layer

### 5.1 Main Entry Point

- `backend/server.js`

Responsibilities:

- Load environment variables.
- Configure Express middleware.
- Configure CORS, Helmet, compression, rate limiting, logging, and JSON body parsing.
- Apply `optionalAuth` globally.
- Register API route modules.
- Expose health endpoints.
- Bootstrap SQLite and MongoDB outside test mode.
- Start sync pipeline outside test mode.
- Export the Express app for tests.

### 5.2 Registered Route Modules

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
- `/api/contributors`
- `/api/export`
- `/api/recommendations`
- `/api/learning-paths`
- `/api/duplicates`
- `/api/chat`
- `/api/graphql`
- `/api/bounties`
- `/api/summary`

### 5.3 Middleware

- `auth.js`
  - `optionalAuth`
  - `requireAuth`
  - `requireRole`

- `validate.js`
  - Zod-backed request validation.

- `ownership.js`
  - Ownership/admin permission helpers.

- `rateLimits.js`
  - Auth, search, AI, and write rate limiters with standardized error responses.

- `errorHandler.js`
  - Route-not-found and unhandled-error envelopes.

---

## 6. Data Architecture

### 6.1 MongoDB Primary Store

MongoDB is used when `isMongoAvailable()` returns true. Mongoose models exist under `backend/models/`.

Current model set includes:

- `Answer`
- `AnswerRevision`
- `Bookmark`
- `Bounty`
- `ChatLog`
- `DuplicateLink`
- `Event`
- `FAQ`
- `FAQRevision`
- `FAQTranslation`
- `Follow`
- `LearningPath`
- `ModerationRecord`
- `Notification`
- `NotificationPreference`
- `QueryRevision`
- `SearchAnalytic`
- `User`
- `UserQuery`
- `Vote`

### 6.2 SQLite Fallback Store

SQLite fallback is initialized in `backend/db/sqlite.js`. It creates core and advanced tables directly and then runs additive migrations under `backend/db/migrations/`.

Important tables include:

- `users`
- `faqs`
- `user_queries`
- `answers`
- `faq_revisions`
- `query_revisions`
- `answer_revisions`
- `votes`
- `bookmarks`
- `follows`
- `notifications`
- `events`
- `moderation_records`
- `duplicate_links`
- `search_analytics`
- `chat_logs`
- `faq_translations`
- `bounties`
- `notification_preferences`
- `learning_paths`
- `learning_path_items`
- `schema_migrations`

### 6.3 Migration Strategy

Migration files:

- `001_stabilize_schema.sql`
- `002_add_sync_indexes.sql`
- `003_notification_metadata.sql`
- `004_add_remaining_lookup_indexes.sql`
- `005_phases_1_and_2.sql`
- `006_phases_3_and_4.sql`
- `007_phases_5_6_7.sql`

Rules:

- Use additive migrations only.
- Do not edit already-applied migrations in production-like environments.
- Keep MongoDB models and SQLite tables in parity for persisted features.
- Ensure tests initialize isolated SQLite files.

---

## 7. Backend Services

Implemented service files include:

- `aiService.js`
- `badgeService.js`
- `categoryService.js`
- `chatRetrievalService.js`
- `decayService.js`
- `duplicateDetectionService.js`
- `eventService.js`
- `exportService.js`
- `followService.js`
- `importService.js`
- `moderationService.js`
- `notificationService.js`
- `queueService.js`
- `recommendationService.js`
- `revisionService.js`
- `syncService.js`
- `translationService.js`

Potential future dedicated services:

- `diffService.js` if server-side text diffing becomes complex.
- `leaderboardService.js` if contributor ranking needs caching or anti-gaming logic.
- `expertMatchingService.js` for SME/expert recommendation workflows.
- `categoryMetricsService.js` for smart/trending category cards.
- `anonymousAuditService.js` for audited anonymous Q&A.

---

## 8. API Contract Policy

### 8.1 Standard Success JSON

For normal API JSON routes:

```json
{
  "status": "success",
  "storage": "sqlite",
  "data": {},
  "meta": {}
}
```

### 8.2 Standard Error JSON

For errors:

```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Human-readable message"
}
```

### 8.3 Raw Download Responses

Export/download endpoints may return raw content instead of the standard envelope if they set appropriate headers such as:

- `Content-Type`
- `Content-Disposition`

Examples:

- JSON array download
- CSV text
- Markdown text
- PDF stream

### 8.4 Compatibility Notes

The codebase is moving toward standardized envelopes, but frontend API helpers should remain compatible with transitional shapes where needed:

- Auth token/user may appear at top level or under `meta`.
- Bookmark action may appear as `body.action` or `body.meta.action`.
- Search payloads may support keyword-based request bodies as well as query-based shapes.
- Export routes should be handled as raw downloads, not normal JSON envelopes.

---

## 9. Testing Strategy

Backend tests use:

- Jest
- Supertest
- Isolated SQLite database files
- MongoDB only when available
- Mocking/bypassing external AI calls in deterministic tests

Important tests include:

- Auth integration tests
- Answer authorization/regression tests
- Delete authorization tests
- Notification route regression tests
- Protected route tests
- Query validation tests
- SQLite persistence tests
- Sync service tests
- Vote integration tests
- Phase 3/4 and Phase 5/6/7 tests
- Universal post-merge diagnostic suite

The universal diagnostic suite should remain the backend post-merge gate and should validate:

- Health endpoint
- SQLite schema and migrations
- Auth and JWT resolution
- Protected route rejection
- FAQ/query/answer flows
- Voting/bookmark/follow flows
- Notification ownership and read state
- Stats/admin read contracts
- Implemented/unimplemented roadmap endpoint stability
- Core service determinism

Frontend test coverage is still a known gap. As frontend-only and backend-integrated features are added, tests should be added for loading states, empty states, error states, role-gated controls, filters, modal/edit interactions, and API-backed rendering.

---

## 10. Known Risks

### 10.1 Frontend/Backend Alignment

The backend has more completed capabilities than the frontend currently exposes. The current sprint is designed to close this gap.

### 10.2 Frontend-Only Scope Creep

Upcoming UI-only features must not accidentally introduce backend or database changes. Backend/database integration requires explicit user approval.

### 10.3 Documentation Drift

`architecture.md`, `prompt-template.md`, `missing-features-roadmap.md`, OpenAPI, and tests must be updated together.

### 10.4 Dual Storage Complexity

Every persisted backend feature needs both MongoDB and SQLite support. Sync, schema parity, and fallback behavior must be tested continuously.

### 10.5 AI Dependency

Gemini-backed services must degrade gracefully. Tests must mock AI calls.

### 10.6 API Envelope Drift

Response shape inconsistencies must be normalized or explicitly documented.

---

## 11. Stabilization and Frontend Sprint Priorities

1. Keep `frontend-sample.txt` as the design/styling source for new frontend work.
2. Pause before implementing any roadmap item until the user selects a specific feature.
3. Keep frontend-only features UI-only until backend/database integration is explicitly approved.
4. Improve `frontend/src/api/faqApi.js` compatibility and raw export handling.
5. Wire contributor leaderboard API.
6. Add advanced search UI, related questions sidebar, and separate FAQ vs Questions sections.
7. Improve notification UI and filters.
8. Wire notification preferences persistence.
9. Add verified/expert answer badges and verified-answer controls where backend-integrated.
10. Add export/import UI.
11. Add translation controls.
12. Add bounty UI.
13. Add learning paths UI.
14. Add revision history/rollback UI.
15. Add admin needs-update queue UI.
16. Add frontend tests or document test gaps.
17. Expand OpenAPI coverage for all frontend-used backend routes.

---

## 12. Development Rule

A backend-integrated feature is complete only when the following are done where applicable:

- Frontend UI or API client integration
- Backend route/service implementation
- MongoDB persistence
- SQLite fallback persistence
- Validation
- Authorization
- Event/audit tracking
- Tests or documented test gap
- OpenAPI documentation
- `architecture.md` update
- `missing-features-roadmap.md` update

A frontend-only prototype is complete only when:

- It follows `frontend-sample.txt` design guidance.
- It does not add backend/database changes.
- It uses mock/local/context data appropriately.
- It has loading/empty/error states where relevant.
- It updates `missing-features-roadmap.md` with implementation evidence.
- It documents any future backend integration gap.
