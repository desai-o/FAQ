# Missing Features Roadmap — Frontend Integration and Frontend-Only Sprint Tracker

_Last updated: 2026-06-19_

## Purpose

This roadmap tracks the next CrowdFAQ frontend sprint.

It includes two kinds of work:

1. **Backend-integrated frontend work**
   - Existing backend functionality should be exposed in the React UI.
   - API helpers may be added or updated in `frontend/src/api/faqApi.js`.
   - OpenAPI and architecture documentation may need updates.

2. **Upcoming frontend-only features**
   - These are UI/UX prototypes only for now.
   - They must not introduce backend routes, database migrations, Mongoose models, SQLite schema changes, sync changes, or new persistence behavior unless the user explicitly approves backend/database integration.

All frontend UI implementation must follow `frontend-sample.txt` as the primary design and styling guide.

---

## Mandatory Implementation Control

Before implementing any item in this roadmap, pause and wait for direct user input selecting the exact feature.

Do not auto-select the next roadmap item.
Do not implement multiple items unless directly requested.
Do not add backend/database integration for frontend-only features unless directly requested.

---

## Required Design Reference

Primary design and styling guide:

```text
frontend-sample.txt
```

Before implementing any frontend UI:

- Read `frontend-sample.txt`.
- Match its layout patterns, spacing, cards, tabs, chips, badges, dashboard/admin styling, responsiveness, and dark/light behavior.
- If `frontend-sample.txt` is unavailable, stop and ask the user to provide it.

---

## Status Definitions

### Complete

The scoped feature is fully implemented for its intended scope.

### Frontend-Only Prototype Pending

The item is planned as UI-only and has not been implemented yet.

### Frontend-Only Prototype Complete

The item is implemented in the frontend using mock/local/context data only, with no backend/database changes.

### Backend Complete / Frontend Pending

Backend functionality exists, but UI is missing or still static/mock.

### Backend-Integrated Complete

The frontend is wired to the existing backend API and has loading/error/empty states.

### In Progress

Implementation has started but is not complete.

### Blocked

Feature cannot proceed because of missing design input, unclear route contract, missing permissions, or user decision required.

---

## Global Rules

- Use `frontend-sample.txt` for design/styling.
- Use `frontend/src/api/faqApi.js` for backend calls.
- Use existing contexts where possible: `AuthContext`, `FAQContext`, `ThemeContext`.
- Preserve existing fallback/local state behavior unless replacing static data with confirmed backend data.
- Add loading, empty, error, and success states.
- Add role-gated controls where relevant.
- Keep frontend-only features UI-only.
- Update this roadmap after each feature implementation.
- Update `architecture.md` when routes/pages/components or integration states change.

---

# Backend-Integrated Frontend Features

These features may call existing backend APIs.

---

## 1. Contributor Leaderboard API Integration

Status: Backend Complete / Frontend Pending
Scope: Backend-integrated
Priority: High

### Goal

Replace static contributor leaderboard data with the backend contributor leaderboard API.

### Likely Backend Route

```text
GET /api/contributors/leaderboard
```

### Frontend Targets

- `frontend/src/pages/Contributors.jsx`
- `frontend/src/api/faqApi.js`

### Required Work

- Add or verify `fetchContributorLeaderboard()`.
- Replace static contributor ranking as the primary source.
- Preserve fallback static data only for API failure.
- Add loading, empty, and error states.
- Preserve medal/tier UI from the current design.

### Acceptance Criteria

- Contributors page renders backend data.
- API failure falls back gracefully or shows a clear error.
- Static data is not primary when API succeeds.

### Implementation Evidence

- Pending.

### Remaining Gaps

- API helper and page wiring.
- Frontend tests.

---

## 2. Export Options

Status: Backend Complete / Frontend Pending
Scope: Backend-integrated
Priority: High

### Goal

Expose export options for JSON, CSV, Markdown, and PDF.

### Likely Backend Route

```text
GET /api/export?format=json|csv|markdown|pdf
```

### Frontend Targets

- `frontend/src/pages/Admin.jsx`
- `frontend/src/api/faqApi.js`
- Optional `ExportPanel.jsx`

### Required Work

- Add `exportFaqs(format, filters)` helper.
- Handle raw file/blob downloads.
- Add export buttons.
- Add progress/loading and error feedback.
- Do not parse raw download responses as standard JSON.

### Acceptance Criteria

- Export buttons trigger downloads.
- All supported formats are represented.
- Failed export shows an error.

### Implementation Evidence

- Pending.

### Remaining Gaps

- UI buttons and raw-response helper.
- Frontend tests.

---

## 3. Import Option with AI-Powered Cleanup

Status: Backend Complete / Frontend Pending
Scope: Backend-integrated if import routes exist; otherwise frontend-only prototype
Priority: High

### Goal

Expose import UI with preview, dry-run validation, and AI cleanup summary if available.

### Likely Backend Routes

```text
POST /api/faqs/import
POST /api/faqs/generate-thread
```

### Frontend Targets

- `frontend/src/pages/Admin.jsx`
- `frontend/src/api/faqApi.js`
- Optional `ImportPanel.jsx`

### Required Work

- Add import helpers if missing.
- Add upload/paste/import panel.
- Add dry-run preview.
- Show cleanup suggestions or AI cleanup summary if backend provides it.
- Confirm before final import.

### Acceptance Criteria

- Admin can preview import before saving.
- Invalid rows are shown clearly.
- Import does not silently create bad data.

### Implementation Evidence

- Pending.

### Remaining Gaps

- Import UI.
- Preview/dry-run state.
- Error handling.

---

## 4. Translation Controls

Status: Backend Complete / Frontend Pending
Scope: Backend-integrated, unless explicitly requested as frontend-only prototype
Priority: High

### Goal

Add translation controls per question and optionally per answer.

### Likely Backend Routes

```text
GET /api/faqs/:id/translations
POST /api/faqs/:id/translations
```

### Frontend Targets

- `frontend/src/pages/QuestionDetail.jsx`
- `frontend/src/api/faqApi.js`
- Optional `TranslationPanel.jsx`

### Required Work

- Add/verify translation API helpers.
- Add language selector.
- Add original/translated toggle.
- Support translation display per question.
- If requested, prototype per-answer translation UI separately.
- Handle AI unavailable state gracefully.

### Acceptance Criteria

- User can request/view translations.
- Original content remains accessible.
- Per-answer translation is clearly scoped if implemented.

### Implementation Evidence

- Pending.

### Remaining Gaps

- UI controls and state.
- Optional answer-level translation design.

---

## 5. Bounty UI — Reputation Link

Status: Backend Complete / Frontend Pending
Scope: Backend-integrated
Priority: High

### Goal

Expose reputation-linked bounty creation and award UI.

### Likely Backend Routes

```text
GET /api/bounties
POST /api/bounties
POST /api/bounties/:id/award
```

### Frontend Targets

- `frontend/src/pages/QuestionDetail.jsx`
- `frontend/src/pages/Questions.jsx`
- `frontend/src/api/faqApi.js`
- Optional `BountyPanel.jsx`

### Required Work

- Add/verify bounty API helpers.
- Show current open bounty state.
- Show reputation cost/link.
- Add sponsor bounty form.
- Add award action for eligible users.
- Refresh UI after bounty creation/award.

### Acceptance Criteria

- Bounties are visible on question detail.
- Reputation link/cost is clear.
- Award action is permission-aware.

### Implementation Evidence

- Pending.

### Remaining Gaps

- Bounty panel and action flow.
- Frontend tests.

---

## 6. Learning Paths

Status: Backend Complete / Frontend Pending
Scope: Backend-integrated
Priority: Medium-High

### Goal

Expose learning paths in the frontend.

### Likely Backend Routes

```text
GET /api/learning-paths
GET /api/learning-paths/:id
POST /api/learning-paths
```

### Frontend Targets

- New `frontend/src/pages/LearningPaths.jsx`
- Optional `frontend/src/pages/LearningPathDetail.jsx`
- `frontend/src/App.jsx`
- `frontend/src/api/faqApi.js`
- Sidebar/navigation components

### Required Work

- Add learning path API helpers.
- Add list page.
- Add detail page if needed.
- Display ordered FAQ items.
- Link FAQs to question detail pages.
- Add create form for authorized users if allowed.

### Acceptance Criteria

- Users can browse learning paths.
- Users can open learning path details.
- Ordered FAQ items render clearly.

### Implementation Evidence

- Pending.

### Remaining Gaps

- New page/routes.
- API helper.
- Navigation link.

---

## 7. Backend Recommendations

Status: Backend Complete / Frontend Pending
Scope: Backend-integrated
Priority: Medium-High

### Goal

Replace static recommendation cards with backend-powered recommendations.

### Likely Backend Route

```text
GET /api/recommendations/faqs
```

### Frontend Targets

- `frontend/src/pages/Subscription.jsx`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/api/faqApi.js`

### Required Work

- Add/verify `fetchFaqRecommendations()`.
- Replace static recommendations as primary source.
- Show recommendation reason/score if available.
- Add loading/empty/error states.

### Acceptance Criteria

- Recommendations are backend-driven.
- Static cards are fallback only.

### Implementation Evidence

- Pending.

### Remaining Gaps

- API wiring.
- Card mapping.

---

## 8. Notification Preferences Persistence

Status: Backend Complete / Frontend Pending
Scope: Backend-integrated
Priority: Medium-High

### Goal

Persist notification preferences through backend endpoints.

### Likely Backend Routes

```text
GET /api/notifications/preferences
PUT /api/notifications/preferences
```

### Frontend Targets

- `frontend/src/components/profile/NotificationPreferences.jsx`
- `frontend/src/pages/Profile.jsx`
- `frontend/src/api/faqApi.js`

### Required Work

- Load preferences from backend.
- Save email/in-app/digest/tag settings.
- Add loading/save/success/error states.
- Keep local state synchronized with backend response.

### Acceptance Criteria

- Preferences persist across refresh/re-login.
- Failed save is visible.

### Implementation Evidence

- Pending.

### Remaining Gaps

- Confirm component uses backend as source of truth.

---

## 9. Revision History and Rollback UI

Status: Backend Complete / Frontend Pending
Scope: Backend-integrated
Priority: Medium

### Goal

Expose revision history and rollback controls for FAQs/answers.

### Likely Backend Routes

```text
GET /api/faqs/:id/revisions
POST /api/faqs/:id/revisions/:revisionId/rollback
GET /api/answers/:id/revisions
POST /api/answers/:id/revisions/:revisionId/rollback
```

### Frontend Targets

- `frontend/src/pages/QuestionDetail.jsx`
- `frontend/src/pages/Admin.jsx`
- `frontend/src/api/faqApi.js`
- Optional `RevisionHistoryPanel.jsx`

### Required Work

- Add revision API helpers.
- Add revision panel.
- Add previous/current comparison view.
- Add rollback confirmation.
- Restrict rollback controls to authorized users.

### Acceptance Criteria

- Authorized users can inspect revisions.
- Authorized users can rollback.
- Current content refreshes after rollback.

### Implementation Evidence

- Pending.

### Remaining Gaps

- UI panel.
- Rollback flow.

---

## 10. Admin Needs-Update Queue

Status: Backend Complete / Frontend Pending
Scope: Backend-integrated
Priority: Medium

### Goal

Expose stale/needs-update FAQ queue in Admin UI.

### Likely Backend Routes

```text
GET /api/admin/needs-update
POST /api/admin/relevance-decay
PATCH /api/faqs/:id/reviewed
POST /api/faqs/:id/flag-stale
```

### Frontend Targets

- `frontend/src/pages/Admin.jsx`
- `frontend/src/api/faqApi.js`
- Optional `NeedsUpdateQueue.jsx`

### Required Work

- Add needs-update API helpers.
- Add admin tab or panel.
- Display stale score, reason, category, and last reviewed date.
- Add mark-reviewed action.
- Add optional run-decay button if route is exposed.

### Acceptance Criteria

- Admin can view needs-update queue.
- Admin can mark content reviewed.
- Queue updates after action.

### Implementation Evidence

- Pending.

### Remaining Gaps

- Admin UI wiring.
- Action states.

---

# Frontend-Only Features — No Backend or Database Integration Yet

The following items are UI-only prototypes unless the user explicitly requests backend/database integration.

---

## 11. Edit Feature for FAQ, Query, Answers

Status: Frontend-Only Prototype Pending
Scope: Frontend-only
Priority: High

### Goal

Add UI affordances for editing FAQ, Query, and Answer content.

### Frontend Targets

- `frontend/src/pages/QuestionDetail.jsx`
- `frontend/src/pages/Questions.jsx`
- `frontend/src/context/FAQContext.jsx`
- Optional reusable edit form component

### Required UI Work

- Add edit buttons.
- Add inline edit mode or modal.
- Add local validation hints.
- Add cancel/save controls.
- Apply local optimistic update only.
- Clearly mark backend persistence as future work.

### Forbidden for Now

- No backend update routes.
- No database migrations.
- No model changes.

### Acceptance Criteria

- User can enter and exit edit mode.
- Local UI can show edited content in-session.
- No backend/database changes are introduced.

---

## 12. Whole Moderation Dashboard and Controls

Status: Frontend-Only Prototype Pending
Scope: Frontend-only by default
Priority: High

### Goal

Build a complete moderation dashboard UI prototype.

### Frontend Targets

- `frontend/src/pages/Admin.jsx`
- Optional `ModerationDashboard.jsx`
- Optional `ModerationQueueCard.jsx`

### Required UI Work

- Pending content review interface.
- Flagging controls.
- Approve/reject/escalate buttons.
- Reason/explanation panel.
- Status tabs.
- Mock queue data if backend integration is not selected.

### Forbidden for Now

- No new moderation backend routes.
- No new database tables.

### Acceptance Criteria

- Full moderation review UX is visible.
- Actions update local/mock state.
- Backend integration is clearly marked as future or optional.

---

## 13. Advanced Search UI

Status: Frontend-Only Prototype Complete
Scope: Frontend-only
Priority: High

### Goal

Improve search controls with filters and sorting.

### Required UI Work

- Category filters.
- Tag filters.
- Sort by newest.
- Sort by votes.
- Clear filters button.
- Client-side filtering/sorting using currently loaded data.

### Acceptance Criteria

- User can filter and sort visible results.
- No backend search changes are introduced.

### Implementation Evidence

- Built the `.advanced-filters-panel` in `frontend/src/pages/Questions.jsx` to show category chips, tag filter search/selection, status sorting (All, Resolved, Open), and sort triggers (Newest, Most Voted).
- Added comprehensive styles for `.advanced-filters-panel`, chips, tags, and state modifiers inside `frontend/src/styles/style.css`.
- Synchronized the advanced filter selection back to the category dropdown and filter tabs, updating search results instantaneously client-side.

### Remaining Gaps

- Future database-linked query indexing if full backend integration is approved.
- Integration tests.

---

## 14. Related Questions Sidebar

Status: Frontend-Only Prototype Complete
Scope: Frontend-only
Priority: Medium-High

### Goal

Show related questions beside question detail.

### Required UI Work

- Sidebar component.
- Match by category/tags/title keywords using local data.
- Empty state if no related items.
- Links to related question detail pages.

### Acceptance Criteria

- Sidebar appears on question detail.
- Related items are computed client-side or mocked.

### Implementation Evidence

- Built a custom `.detail-grid` layout wrapping the page in a split view: `.detail-main` (the core FAQ/Question details, answers, reply) and `.detail-sidebar` (containing the Related Questions widget).
- Implemented an intelligent client-side sorting and scoring algorithm in `QuestionDetail.jsx` matching category similarity (weight: 5), overlapping tags (weight: 3), and title keywords (weight: 2) dynamically using data already in `FAQContext`.
- Formatted items according to the design guidelines from `frontend-sample.txt` (category pills, title routing, votes and answers count), including a fallback empty state when no related items match.
- Appended styling variables and classes under `Related Questions Sidebar Styling` in `frontend/src/styles/style.css`.
- Synchronized detail page re-scroll top behavior via `useEffect` tracking `id`.

### Remaining Gaps

- Integration tests.

---

## 15. Separate FAQ vs Questions Section

Status: Frontend-Only Prototype Pending
Scope: Frontend-only
Priority: Medium-High

### Goal

Separate resolved knowledge entries from open community questions.

### Required UI Work

- Add tabs or separate sections for FAQs and Questions.
- Show resolved/published FAQs separately from pending/unanswered questions.
- Preserve existing question flows.

### Acceptance Criteria

- UI clearly distinguishes FAQs from open questions.
- No backend schema changes are introduced.

---

## 16. Badges/Milestone Progress Meter

Status: Frontend-Only Prototype Pending
Scope: Frontend-only
Priority: Medium

### Goal

Show milestone progress based on reputation increments.

### Required UI Work

- Progress bar/meter.
- Current reputation.
- Next milestone threshold.
- Badge preview.
- Use existing profile/user reputation or mock value.

### Acceptance Criteria

- User can see progress toward next badge/milestone.
- No backend badge logic changes are introduced.

---

## 17. Notifications Improvement

Status: Frontend-Only Prototype Complete
Scope: Frontend-only
Priority: Medium

### Goal

Improve notification display and interactions.

### Required UI Work

- Better notification cards/list.
- Read/unread styling.
- Grouping by day/type.
- Priority or warning labels.
- Empty state.
- Local UI state transitions.

### Acceptance Criteria

- Notification UI is clearer and more usable.
- Existing backend notification behavior is preserved.

### Implementation Evidence

- Created `frontend/src/components/notifications/NotificationCard.jsx` — card with type icons (answer/question/upvote/warning/follow/info), color-coded dot, relative timestamp, read/unread styling, mark-read on click, delete button.
- Created `frontend/src/components/notifications/NotificationGroup.jsx` — sticky group section headers (Today, Yesterday, This Week, Older).
- Created `frontend/src/components/notifications/NotificationFilters.jsx` — filter chips (All, Answers, Questions, Upvotes, Warnings) with client-side filtering.
- Created `frontend/src/components/notifications/NotificationSearch.jsx` — search input with clear button, filters by message text client-side.
- Created `frontend/src/components/notifications/NotificationCenter.jsx` — main container with loading skeleton, error state, empty states (all-caught-up, no-matching-results), grouped display, "Mark all read" action, fetch/delete/read state management.
- Updated `frontend/src/components/Topbar.jsx` — replaced inline notification dropdown with `<NotificationCenter />` component.
- Added all notification styles to `frontend/src/styles/style.css` (`.notif-center`, `.notif-card`, `.notif-group`, `.notif-filters`, `.notif-search`, loading/empty/error states, dark mode).
- No backend routes, database migrations, or schema changes introduced.
- Uses existing `fetchNotifications`, `markNotificationsAsRead`, `markNotificationAsRead`, `deleteNotification` from `faqApi.js`.

---

## 18. Subscription Thread Controls + Search Filters

Status: Frontend-Only Prototype Pending
Scope: Frontend-only
Priority: Medium

### Goal

Improve subscription/followed-thread management UI.

### Required UI Work

- Search subscriptions.
- Filter by thread/tag/category.
- Sort by recent activity.
- Mute/unmute UI if existing frontend action is available.
- Use mock/local data if backend-specific filter route is absent.

### Acceptance Criteria

- User can search/filter subscription entries.
- No backend filter endpoints are added.

---

## 19. Profile Page Activity Visualization

Status: Frontend-Only Prototype Pending
Scope: Frontend-only
Priority: Medium

### Goal

Add activity visualization to the profile page.

### Required UI Work

- Timeline, chart, heatmap, or streak-style activity view.
- Use existing activity/profile data or mock data.
- Match styling from `frontend-sample.txt`.

### Acceptance Criteria

- Activity visualization appears on profile.
- It handles empty/mock data gracefully.

---

## 20. Verified Badges on Expert Answers

Status: Frontend-Only Prototype Pending
Scope: Frontend-only unless backend verification route is selected
Priority: Medium

### Goal

Show verified/expert badges on answers by expert-classified users.

### Required UI Work

- Add expert badge display.
- Determine expert label from existing user role/badge data or mock flag.
- Style badge according to `frontend-sample.txt`.

### Acceptance Criteria

- Expert answers are visually distinct.
- No new backend expert-classification model is added.

---

## 21. Notification Filters

Status: Frontend-Only Prototype Complete
Scope: Frontend-only
Priority: Medium

### Goal

Add notification filters.

### Required Filters

- All
- Answers only
- Questions only
- Upvotes only
- Flags/warnings

### Required UI Work

- Filter chips/tabs.
- Client-side filtering over current notification list.
- Empty state per filter.

### Acceptance Criteria

- Filters work on currently loaded notifications.
- No backend notification filtering route is added.

### Implementation Evidence

- Implemented via `NotificationFilters.jsx` with chip-based filter bar (All, Answers, Questions, Upvotes, Warnings).
- Filter state flows through `NotificationCenter.jsx` — client-side filtering using type inference from message text.
- Empty state shows "No notifications to show for this filter" when filter yields zero results.
- No backend changes introduced.

---

# Cross-Cutting Tasks

## API Client Compatibility

Status: Stabilization Required
Priority: High

### Required Work

`frontend/src/api/faqApi.js` should centralize:

- standard envelope parsing,
- legacy response compatibility,
- raw export/download handling,
- token headers,
- timeouts/retries,
- useful error messages.

---

## OpenAPI Coverage for Backend-Integrated Features

Status: Stabilization Required
Priority: Medium-High

### Required Work

Ensure OpenAPI documents all backend routes used by integrated frontend features.

---

## Frontend Test Coverage

Status: Stabilization Required
Priority: Medium

### Required Work

Add or track tests for:

- filters,
- edit mode,
- moderation prototype interactions,
- leaderboard API rendering,
- export/import helpers,
- translation controls,
- bounty UI,
- learning paths,
- notification filters/preferences,
- profile activity visualization.

---

## Persistence/Rehydration Fix — Questions Disappearing After Reload

Status: Complete
Scope: Frontend persistence/reload fix
Files Changed:
- `frontend/src/context/FAQContext.jsx`
- `frontend/src/pages/Questions.jsx`
- `frontend/src/pages/QuestionDetail.jsx`
- `frontend/public/widget.js`
- `backend/server.js`

Implementation Evidence:
- Frontend now fetches both `/api/faqs` and `/api/queries`.
- Frontend merges backend data with local unsynced questions.
- New questions submitted as queries remain visible after reload.
- SQLite fallback direct test confirms records persist in `user_queries`.

Remaining Gaps:
- Add automated frontend tests for offline/unsynced question rehydration.

---

## Recommended Execution Order

The LLM must not start automatically. The user must select the exact item.

Suggested order after user selection begins:

1. API client compatibility cleanup.
2. Advanced search UI.
3. Separate FAQ vs Questions section.
4. Related questions sidebar.
5. Contributor leaderboard API integration.
6. Notification filters and notification UI improvement.
7. Notification preferences persistence.
8. Verified answer/expert badge UI.
9. Badges/milestone progress meter.
10. Export options.
11. Import UI with cleanup preview.
12. Translation controls.
13. Bounty UI.
14. Learning paths.
15. Revision history/rollback UI.
16. Admin needs-update queue.
17. Moderation dashboard prototype.
18. Edit feature for FAQ, Query, Answers.
19. Profile page activity visualization.
20. Subscription thread controls and search filters.

---

## Definition of Done

A roadmap item is done only when:

- Its scope is respected.
- Frontend follows `frontend-sample.txt`.
- UI has loading/empty/error states where relevant.
- Backend-integrated items use `faqApi.js`.
- Frontend-only items do not add backend/database work.
- Role-gated controls are handled when relevant.
- `missing-features-roadmap.md` is updated with implementation evidence.
- `architecture.md` is updated if app structure changes.
- Tests are added or test gaps are documented.
