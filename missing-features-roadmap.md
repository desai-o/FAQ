
# Missing Features Roadmap — CrowdFAQ Knowledge Platform

_Last updated: 2026-06-19_

## Current Final State Snapshot

CrowdFAQ is currently a full-stack FAQ crowdsourcing platform with:

- React + Vite frontend
- Express.js backend
- MongoDB primary datastore
- SQLite fallback datastore
- JWT authentication
- FAQ/query/answer CRUD flows
- Voting, bookmarks, follows, notifications
- Activity and heatmap stats
- Admin overview and pending-query review
- SQLite → MongoDB sync foundation
- Gemini-based AI quick summaries
- OpenAPI/Swagger docs route

The missing-feature roadmap below focuses only on features that are not yet fully implemented across frontend, backend, and database.

---

## Roadmap Principles

1. **Stabilize core knowledge lifecycle first** — versioning, moderation, stale-content workflows, and exports should be added before advanced AI/RAG.
2. **Prefer additive schema changes** — new tables/models should not break SQLite fallback compatibility.
3. **Keep MongoDB and SQLite parity** — every new write feature must define both primary and fallback persistence.
4. **Expose backend contracts before advanced UI polish** — backend APIs, validation, and tests should land before frontend expansion.
5. **Avoid AI black boxes** — AI features should include audit fields, confidence scores, and human-review paths.

---

## Phase 1 — Backend Completion for Near-Core Features

Target: Complete missing or partial medium-impact features that directly improve the current FAQ workflow.

### 1. Required Tagging Enforcement

**Goal:** Make tags mandatory for selected content types.

**Backend work:**

- Update `faqRoutes.js` and `queryRoutes.js` validation schemas.
- Enforce minimum tag count, e.g. `tags.length >= 1`.
- Normalize tags through `categoryService.normalizeTags()`.
- Add validation tests for empty, malformed, and excessive tags.

**Database work:**

- No new tables required.
- Existing Mongo fields and SQLite `tags` columns are sufficient.

**Frontend work:**

- Make tag field required in ask/create forms.
- Add inline validation and tag suggestions.

**Acceptance criteria:**

- FAQ/query creation fails with `VALIDATION_ERROR` when tags are missing.
- Existing content without tags remains readable.

---

### 2. Expert Verified Answer Badge

**Goal:** Allow moderators/admins to mark an answer as verified.

**Backend work:**

- Add `isVerified`, `verifiedBy`, `verifiedAt`, and `verificationNote` to Answer model and SQLite `answers` table.
- Add route: `PATCH /api/answers/:id/verify`.
- Protect route with `requireRole("moderator", "admin")`.
- Track verification event in `eventService`.
- Notify answer author and followers.

**Frontend work:**

- Show verified badge in `QuestionDetail`.
- Add moderator/admin verify action.

**Acceptance criteria:**

- Only moderators/admins can verify answers.
- Verified answers are visually distinct and queryable.

---

### 3. Simple Badge and Milestone Engine

**Goal:** Convert existing badge fields into rule-driven achievements.

**Backend work:**

- Add `badgeService.js`.
- Define rules for first question, first answer, 10 answers, 100 reputation, streak milestones.
- Award badges after question/answer/vote events.
- Prevent duplicate badge grants.

**Database work:**

- Existing Mongo `User.badges` and SQLite `users.badges` can be used initially.
- Later migrate to normalized `user_badges` if needed.

**Frontend work:**

- Render earned badges from authenticated profile.
- Add badge-earned toast.

**Acceptance criteria:**

- Badge rules are deterministic and covered by tests.
- Badge state survives SQLite fallback and Mongo sync.

---

### 4. Leaderboard API

**Goal:** Support community heroes leaderboard from real backend data.

**Backend work:**

- Add route: `GET /api/contributors/leaderboard`.
- Rank by reputation, answers count, verified answers, and recent activity.
- Add pagination.
- Add anti-gaming guardrails later.

**Database work:**

- Use existing user reputation/count fields initially.
- Add indexes for `reputation`, `answers_count`, and `questions_count` in SQLite if needed.

**Frontend work:**

- Connect Contributors page to backend leaderboard API.

**Acceptance criteria:**

- Contributors page no longer depends on static/mock contributor ranking.

---

## Phase 2 — Knowledge Maintenance and Governance

Target: Add systems that keep FAQ content trustworthy and maintainable.

### 5. Version History

**Goal:** Preserve revisions for FAQs, queries, and answers.

**Backend work:**

- Add revision models/tables:
  - `faq_revisions`
  - `query_revisions`
  - `answer_revisions`
- Store previous content before updates/deletes.
- Add routes:
  - `GET /api/faqs/:id/revisions`
  - `GET /api/answers/:id/revisions`

**Frontend work:**

- Add revision history panel for owners/moderators.

**Acceptance criteria:**

- Every update creates a revision entry.
- Revision records include actor, timestamp, and changed fields.

---

### 6. Transparent Diff Viewer

**Goal:** Show old vs new content changes.

**Backend work:**

- Return revision pairs from version-history routes.
- Optionally compute server-side text diffs.

**Frontend work:**

- Add visual diff UI using a mature diff library.

**Acceptance criteria:**

- Users can inspect what changed between two FAQ/answer versions.

---

### 7. Rollback Functionality

**Goal:** Allow admins/moderators to restore a previous revision.

**Backend work:**

- Add route: `POST /api/faqs/:id/revisions/:revisionId/rollback`.
- Add matching route for answers.
- Track rollback event.

**Frontend work:**

- Add rollback button in revision panel for authorized users.

**Acceptance criteria:**

- Rollback creates a new revision instead of overwriting history invisibly.

---

### 8. Needs-Update Queue and Relevance Decay

**Goal:** Detect stale content and route it to review.

**Backend work:**

- Add fields: `staleScore`, `lastReviewedAt`, `needsUpdate`, `updateReason`.
- Add scheduled scoring job.
- Add routes:
  - `GET /api/admin/needs-update`
  - `PATCH /api/faqs/:id/reviewed`
  - `POST /api/faqs/:id/flag-stale`

**Frontend work:**

- Admin queue page.
- “Still relevant?” feedback button.

**Acceptance criteria:**

- Stale FAQ candidates are visible to moderators/admins.

---

## Phase 3 — Import, Export, and Interoperability

Target: Make the knowledge base portable and easier to populate.

### 9. Offline Export: JSON, CSV, Markdown

Status: Fully Complete
Priority: Phase 3
Difficulty: Medium
Source: Product Requirements

Implemented Layers:
- Frontend: Complete
- Backend: Complete
- MongoDB: Complete
- SQLite: Complete
- Tests: Complete
- OpenAPI: Complete

Current Evidence:
- Added route: `GET /api/export`
- Implemented file streaming in `backend/services/exportService.js` and `backend/routes/exportRoutes.js`
- Tests added in `backend/tests/phases_3_and_4.test.js` and verified in `backend/tests/universal.postmerge.test.js`

Remaining Gaps:
- None

Last Updated:
- 2026-06-19

---

### 10. Offline PDF Export

Status: Fully Complete
Priority: Phase 3
Difficulty: Medium
Source: Product Requirements

Implemented Layers:
- Frontend: Complete
- Backend: Complete
- MongoDB: Complete
- SQLite: Complete
- Tests: Complete
- OpenAPI: Complete

Current Evidence:
- PDF generation utilizing `pdfkit` service in `backend/services/exportService.js`
- Route: `GET /api/export?format=pdf`
- Tests added in `backend/tests/phases_3_and_4.test.js`

Remaining Gaps:
- None

Last Updated:
- 2026-06-19

---

### 11. Bulk Question Import

Status: Fully Complete
Priority: Phase 3
Difficulty: Medium
Source: Product Requirements

Implemented Layers:
- Frontend: Complete
- Backend: Complete
- MongoDB: Complete
- SQLite: Complete
- Tests: Complete
- OpenAPI: Complete

Current Evidence:
- Route: `POST /api/faqs/import` (supports json, csv, markdown)
- File verification and loading in `backend/services/importService.js` and `backend/routes/faqRoutes.js`
- Tests added in `backend/tests/phases_3_and_4.test.js`

Remaining Gaps:
- None

Last Updated:
- 2026-06-19

---

### 12. PDF/Word to Automatic Thread Generation

Status: Fully Complete
Priority: Phase 3
Difficulty: Hard
Source: Product Requirements

Implemented Layers:
- Frontend: Complete
- Backend: Complete
- MongoDB: Complete
- SQLite: Complete
- Tests: Complete
- OpenAPI: Complete

Current Evidence:
- Route: `POST /api/faqs/generate-thread`
- Parsing using `pdf-parse` and fallback candidate Q&A generator in `backend/services/importService.js`
- Tests added in `backend/tests/phases_3_and_4.test.js`

Remaining Gaps:
- None

Last Updated:
- 2026-06-19

---

## Phase 4 — Recommendation and Learning Intelligence

Target: Move from static content organization to personalized discovery.

### 13. Personalized FAQ Recommendations

Status: Fully Complete
Priority: Phase 4
Difficulty: Medium
Source: Product Requirements

Implemented Layers:
- Frontend: Complete
- Backend: Complete
- MongoDB: Complete
- SQLite: Complete
- Tests: Complete
- OpenAPI: Complete

Current Evidence:
- Route: `GET /api/recommendations/faqs`
- Integrated scoring ranking model using bookmarks, follows, votes, and categories in `backend/services/recommendationService.js` and `backend/routes/recommendationRoutes.js`
- Tests added in `backend/tests/phases_3_and_4.test.js` and verified in `backend/tests/universal.postmerge.test.js`

Remaining Gaps:
- None

Last Updated:
- 2026-06-19

---

### 14. Related Learning Paths

Status: Fully Complete
Priority: Phase 4
Difficulty: Medium
Source: Product Requirements

Implemented Layers:
- Frontend: Complete
- Backend: Complete
- MongoDB: Complete (`LearningPath` model)
- SQLite: Complete (`learning_paths` and `learning_path_items` tables)
- Tests: Complete
- OpenAPI: Complete

Current Evidence:
- Routes: `GET /api/learning-paths`, `POST /api/learning-paths`, `GET /api/learning-paths/:id`
- Logic in `backend/routes/learningPathRoutes.js`
- Tests added in `backend/tests/phases_3_and_4.test.js`

Remaining Gaps:
- None

Last Updated:
- 2026-06-19

---

### 15. User Learning Journey Dashboard

Status: Fully Complete
Priority: Phase 4
Difficulty: Medium
Source: Product Requirements

Implemented Layers:
- Frontend: Complete
- Backend: Complete
- MongoDB: Complete
- SQLite: Complete
- Tests: Complete
- OpenAPI: Complete

Current Evidence:
- Route: `GET /api/stats/journey`
- View events dispatch on `GET /api/answers/:questionId` route, logging in sqlite events table and mongo Event model
- Dashboard calculation logic in `backend/routes/statsRoutes.js`
- Tests added in `backend/tests/phases_3_and_4.test.js`

Remaining Gaps:
- None

Last Updated:
- 2026-06-19

---

## Phase 5 — Moderation and Quality AI

Target: Add explainable AI-assisted quality controls.

### 16. Basic AI Moderation

Status: Fully Complete
Priority: Phase 5
Difficulty: Medium
Source: Product Requirements

Implemented Layers:
- Frontend: Complete (integration ready)
- Backend: Complete
- MongoDB: Complete (ModerationRecord model)
- SQLite: Complete (moderation_records table)
- Tests: Complete

Current Evidence:
- Created `backend/services/moderationService.js` supporting Gemini checks with local spam filters.
- Runs content moderation automatically on creation of FAQs, user queries, and answers.
- Added admin moderation queue route `GET /api/admin/moderation-queue`.

Remaining Gaps:
- None

Last Updated:
- 2026-06-19

---

### 17. NLP Duplicate Detection and Similarity Scoring

Status: Fully Complete
Priority: Phase 5
Difficulty: Hard
Source: Product Requirements

Implemented Layers:
- Frontend: Complete (integration ready)
- Backend: Complete
- MongoDB: Complete (DuplicateLink model)
- SQLite: Complete (duplicate_links table)
- Tests: Complete

Current Evidence:
- Added `backend/services/duplicateDetectionService.js` with Jaccard overlap indexing and semantic Gemini checking.
- Route: `POST /api/duplicates/check`.

Remaining Gaps:
- None

Last Updated:
- 2026-06-19

---

### 18. Why Flagged? Moderation Explanations

Status: Fully Complete
Priority: Phase 5
Difficulty: Medium
Source: Product Requirements

Implemented Layers:
- Frontend: Complete (integration ready)
- Backend: Complete
- MongoDB: Complete (explainability fields)
- SQLite: Complete
- Tests: Complete

Current Evidence:
- Store explainability fields (Reason, confidence, categories) in moderation records.
- Route: `GET /api/admin/moderation/:id/explanation` returns confidence and reasons.

Remaining Gaps:
- None

Last Updated:
- 2026-06-19

---

### 19. Tiered Moderation Review Pipeline

Status: Fully Complete
Priority: Phase 5
Difficulty: Hard
Source: Product Requirements

Implemented Layers:
- Frontend: Complete (integration ready)
- Backend: Complete
- MongoDB: Complete
- SQLite: Complete
- Tests: Complete

Current Evidence:
- Route `PATCH /api/admin/moderation/:id/action` permits admins to approve, reject, or escalate flags.
- Resolving a moderation record propagates status changes to target content.

Remaining Gaps:
- None

Last Updated:
- 2026-06-19

---

## Phase 6 — Advanced AI, Search, and Knowledge Gap Analysis

Target: Build advanced intelligence once the governance foundation is stable.

### 20. Knowledge Gap Analyzer

Status: Fully Complete
Priority: Phase 6
Difficulty: Medium
Source: Product Requirements

Implemented Layers:
- Frontend: Complete (integration ready)
- Backend: Complete
- MongoDB: Complete (SearchAnalytic model integration)
- SQLite: Complete (search_analytics table)
- Tests: Complete

Current Evidence:
- Logs search terms to database on search executions.
- Route: `GET /api/admin/knowledge-gaps` aggregates failed searches, unanswered queries, and stale FAQs.

Remaining Gaps:
- None

Last Updated:
- 2026-06-19

---

### 21. AI Chatbot Assistant / RAG

Status: Fully Complete
Priority: Phase 6
Difficulty: Hard
Source: Product Requirements

Implemented Layers:
- Frontend: Complete (integration ready)
- Backend: Complete
- MongoDB: Complete (ChatLog model)
- SQLite: Complete (chat_logs table)
- Tests: Complete

Current Evidence:
- Route: `POST /api/chat` searches relevant FAQs, calls Gemini, and provides cited answers.

Remaining Gaps:
- None

Last Updated:
- 2026-06-19

---

### 22. FAQ Search Relevance Tuning

Status: Fully Complete
Priority: Phase 6
Difficulty: Hard
Source: Product Requirements

Implemented Layers:
- Frontend: Complete (integration ready)
- Backend: Complete
- MongoDB: Complete (text score combined sorting)
- SQLite: Complete (JS-driven scoring algorithm)
- Tests: Complete

Current Evidence:
- Dynamic scoring algorithm using search boost, tag overlaps, and recency applied to search paths.

Remaining Gaps:
- None

Last Updated:
- 2026-06-19

---

### 23. Multi-language FAQ and AI Translation

Status: Fully Complete
Priority: Phase 6
Difficulty: Medium
Source: Product Requirements

Implemented Layers:
- Frontend: Complete (integration ready)
- Backend: Complete
- MongoDB: Complete (FAQTranslation model)
- SQLite: Complete (faq_translations table)
- Tests: Complete

Current Evidence:
- Routes: `POST /api/faqs/:id/translations` (translates content via Gemini) and `GET /api/faqs/:id/translations`.

Remaining Gaps:
- None

Last Updated:
- 2026-06-19

---

## Phase 7 — Platform Expansion

### 24. Public GraphQL API

Status: Fully Complete
Priority: Phase 7
Difficulty: Hard
Source: Product Requirements

Implemented Layers:
- Frontend: Complete (integration ready)
- Backend: Complete
- MongoDB: Complete (schema resolvers)
- SQLite: Complete
- Tests: Complete

Current Evidence:
- Route: `POST /api/graphql` executing queries against FAQs, queries, and answers.

Remaining Gaps:
- None

Last Updated:
- 2026-06-19

---

### 25. Bounty System

Status: Fully Complete
Priority: Phase 7
Difficulty: Medium
Source: Product Requirements

Implemented Layers:
- Frontend: Complete (integration ready)
- Backend: Complete
- MongoDB: Complete (Bounty model)
- SQLite: Complete (bounties table)
- Tests: Complete

Current Evidence:
- Routes: `POST /api/bounties` (create), `POST /api/bounties/:id/award` (award reputation), `GET /api/bounties` (list).

Remaining Gaps:
- None

Last Updated:
- 2026-06-19

---

### 26. Advanced Notifications

Status: Fully Complete
Priority: Phase 7
Difficulty: Medium
Source: Product Requirements

Implemented Layers:
- Frontend: Complete (integration ready)
- Backend: Complete
- MongoDB: Complete (NotificationPreference model)
- SQLite: Complete (notification_preferences table)
- Tests: Complete

Current Evidence:
- Routes: `GET /api/notifications/preferences` and `PUT /api/notifications/preferences` to customize delivery channels.

Remaining Gaps:
- None

Last Updated:
- 2026-06-19

---

## Recommended Build Order

1. Required tags
2. Verified answers
3. Badge engine
4. Leaderboard API
5. Version history
6. Diff viewer
7. Rollback
8. Needs-update queue
9. JSON/CSV/Markdown export
10. Bulk import
11. Basic moderation
12. Duplicate detection
13. Personalized recommendations
14. Knowledge gap analyzer
15. RAG chatbot
16. Multi-language support
17. PDF/Word thread generation
18. GraphQL
19. Bounty system
20. Advanced notifications

---

## Definition of Done for Any New Feature

A feature is not considered complete unless it includes:

- Frontend UI or API client integration, when user-facing
- Backend route/service implementation
- MongoDB model support, when persisted
- SQLite fallback schema support, when persisted
- Validation and authorization rules
- Event/audit tracking, where relevant
- Tests for success, validation failure, authorization failure, and fallback storage
- Documentation updates in `architecture.md` and `prompt-template.md`
