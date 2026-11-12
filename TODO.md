# TODO.md — Minuto Development Tasks

## Status Legend
- `[ ]` Not started
- `[-]` In progress
- `[x]` Completed
- `[!]` Blocked

---

## PHASE 0 — Project Audit & Planning ✅

- [x] Inspect backend codebase
- [x] Inspect frontend codebase
- [x] Document current functionality
- [x] Identify missing features
- [x] Create PRODUCT_REQUIREMENTS.md
- [x] Create DESIGN_SYSTEM.md
- [x] Create IMPLEMENTATION_PLAN.md
- [x] Create TODO.md (this file)
- [x] Create PROGRESS.md

---

## PHASE 1 — Design System & Application Shell

### 1.1 Sidebar Navigation
- [x] Create `components/layout/sidebar.tsx`
  - Logo + product name at top
  - Navigation links: Dashboard, New Meeting, My Meetings, Action Items, AI Search, Templates
  - Settings + profile at bottom
  - Active state indicator
  - Collapsible on tablet/mobile
- [x] Create `components/layout/app-shell.tsx`
  - Sidebar + main content layout
  - Responsive breakpoint handling
- [x] Update `app/layout.tsx` to use AppShell
- [x] Migrate from top navbar to sidebar (keep navbar for mobile)
  - Dashboard ✅
  - Upload ✅
  - Ask ✅
  - Meeting detail ✅
  - Live recording ✅

### 1.2 Design Tokens
- [x] Create `lib/design-tokens.ts` with color/spacing/typography constants
- [x] Update `globals.css` with success/warning colors
- [x] Update dark mode colors
- [ ] Verify all components use semantic tokens (not hardcoded colors)

### 1.3 Dark Mode
- [x] Add theme toggle to sidebar footer
- [x] Create `hooks/use-theme.ts`
- [x] Test all components in dark mode
- [x] Fix any contrast issues

### 1.4 Polish States
- [x] Create unified loading component (`components/ui/loading-state.tsx`)
- [x] Create unified empty state component (`components/ui/empty-state.tsx`)
- [x] Create unified error state component (`components/ui/error-state.tsx`)
- [x] Apply to dashboard page
- [x] Apply to meeting detail page

**Acceptance criteria:**
- Sidebar navigation works on desktop
- Mobile shows top navbar (current behavior)
- Dark mode toggleable
- All states (loading/empty/error) consistent

---

## PHASE 2 — Dashboard & Meeting Library

### 2.1 Dashboard Improvements
- [ ] Real statistics from backend (total meetings, total duration, this month)
- [ ] Recent meetings list (last 5)
- [ ] Quick action cards (Record, Upload, View All)
- [ ] Processing indicator for in-progress meetings

### 2.2 Meeting Management
- [x] Meeting rename (inline edit)
- [x] Meeting delete with confirmation dialog
- [x] Meeting archive (soft delete)
- [x] Bulk actions (select multiple → delete/archive)

### 2.3 Meeting List Page
- [x] Create dedicated `/meetings` page (separate from dashboard)
- [x] Pagination (12 items per page)
- [x] Advanced filters (date range, status, duration)
- [x] Sort options (newest, oldest, duration, alphabetical)
- [x] List/grid view toggle
- [x] Bulk actions (select multiple → delete/archive)

### 2.4 Backend Endpoints
- [x] `PATCH /api/meetings/{id}` — update title
- [x] `POST /api/meetings/{id}/archive` — soft delete
- [ ] `GET /api/meetings` — add pagination params
- [ ] `DELETE /api/meetings/{id}` — permanent delete (already exists)

**Acceptance criteria:**
- Dashboard shows real stats
- Can rename/delete/archive meetings
- Meeting list paginated
- Filters work correctly

---

## PHASE 3 — Recording & Upload Refinement

### 3.1 Live Recording UI
- [x] Improve waveform visualization
- [x] Better timer display (MM:SS format)
- [x] Recording quality indicator (audio level %)
- [ ] Audio input device selector
- [x] Pause/resume animation
- [ ] Bookmark button (timestamp markers)

### 3.2 Upload Improvements
- [x] Better progress bar (percentage + ETA)
- [x] File preview before upload (duration, format)
- [ ] Batch upload (multiple files)
- [ ] Upload queue management

### 3.3 Reliability
- [ ] Recording recovery from browser crash
- [ ] Auto-save recording chunks to IndexedDB
- [ ] Reconnect WebSocket automatically
- [ ] Better error messages for permission denied

**Acceptance criteria:**
- Recording UI polished
- Upload shows clear progress
- Recording survives brief network interruption

---

## PHASE 4 — Meeting Details Enhancement

### 4.1 Transcript Editor
- [x] Create `components/meeting/transcript-editor.tsx`
- [x] Inline text editing (contentEditable)
- [x] Speaker label editing
- [x] Auto-save on blur
- [ ] Undo/redo support
- [x] Backend: `PUT /api/meetings/{id}/transcript`

### 4.2 Summary Controls
- [ ] Regenerate summary button
- [ ] Summary length selector (short/medium/detailed)
- [ ] Summary language selector
- [ ] Edit summary text
- [ ] Copy summary to clipboard

### 4.3 Audio Player
- [x] Create `components/meeting/audio-player.tsx`
- [x] Persistent player across tabs
- [x] Playback speed control (0.5x, 1x, 1.5x, 2x)
- [x] Click transcript timestamp → seek audio
- [x] Highlight active transcript segment during playback

### 4.4 Action Items (in meeting)
- [x] Display action items with checkboxes
- [x] Mark complete/incomplete
- [x] Edit owner/due date
- [ ] Link to central action items page

### 4.5 Meeting Metadata
- [x] Edit meeting title (inline)
- [ ] Edit meeting date
- [x] Manage participants list
- [ ] Add meeting notes/description

**Acceptance criteria:**
- Can edit transcript text
- Can regenerate summary
- Audio player persists across tabs
- Action items editable

---

## PHASE 5 — Formal Meeting Minutes

### 5.1 Minutes Editor
- [ ] Create `components/minutes/minutes-editor.tsx`
- [ ] Section-by-section editing
- [ ] Add/remove sections
- [ ] Reorder sections (drag & drop)
- [ ] Regenerate individual sections

### 5.2 Templates
- [ ] Default Mongolian template (Хурлын тэмдэглэл)
- [ ] Template selector
- [ ] Preview before export

### 5.3 Export
- [x] PDF export (in addition to DOCX)
- [ ] Export options (include transcript, exclude sections)
- [ ] Custom filename

### 5.4 Backend
- [ ] Create `services/export_pdf.py`
- [ ] Update `services/export_docx.py` for template support
- [ ] Add `POST /api/meetings/{id}/export` with format param

**Acceptance criteria:**
- Can edit minutes sections
- PDF export works
- Template selectable

---

## PHASE 6 — Action Management

### 6.1 Central Action Items Page
- [x] Create `app/actions/page.tsx`
- [x] List all action items across meetings
- [x] Filter: All, Open, Done, Overdue
- [x] Search by task, meeting, owner

### 6.2 Task Management
- [x] Toggle task status (open/done)
- [x] Edit owner (from meeting detail)
- [x] Edit due date (from meeting detail)
- [x] Link to source meeting
- [ ] Create task manually
- [ ] Delete task

### 6.3 Backend
- [x] Extract action items from meeting minutes
- [x] Update action items via API
- [ ] Dedicated ActionItem model (separate from minutes)
- [ ] Task assignment to users
- [ ] Notifications

**Acceptance criteria:**
- Central action items page works
- Can toggle status
- Tasks linked to source meetings

---

## PHASE 7 — Advanced AI Features

### 7.1 Cross-Meeting Search
- [x] Improve `/ask` page for multi-meeting search
- [x] Search across all user's meetings
- [x] Filter by date range, meeting, participant
- [ ] Show results grouped by meeting

### 7.2 Hybrid Search (Semantic-ähnlich)
- [x] Mongolian stemming (нөхцөл дагавар авах)
- [x] Business term synonyms
- [x] BM25-inspired scoring
- [x] Better search relevance for Mongolian text

### 7.3 AI Enhancements
- [x] Topic segmentation (auto-detect topics)
- [ ] Improved speaker diarization
- [ ] Meeting comparison (what changed between meetings)
- [ ] AI-generated task suggestions

**Acceptance criteria:**
- Cross-meeting search works
- Semantic search returns relevant results
- Topics auto-detected

---

## PHASE 8 — Templates & Workspaces

### 8.1 Meeting Templates
- [x] Create `app/templates/page.tsx`
- [x] Template library (formal, standup, brainstorm, interview, lecture)
- [x] Custom template creation
- [ ] Apply template to new meeting
- [x] Backend: Template model + API

### 8.2 Workspaces
- [x] Create `app/workspaces/page.tsx`
- [x] Personal workspace (default)
- [x] Organization workspace
- [x] Invite team members
- [x] Role-based permissions (owner, admin, editor, viewer)

### 8.3 Projects/Folders
- [x] Organize meetings by project
- [x] Folder structure
- [x] Move meetings between projects

### 8.4 Backend
- [x] Workspace model
- [x] Template model
- [x] Project/Folder model
- [x] Permission system
- [x] Sharing endpoints

**Acceptance criteria:**
- Templates work
- Workspaces with permissions
- Projects organize meetings

---

## PHASE 9 — Settings & Integrations

### 9.1 Settings Page
- [x] Create `app/settings/page.tsx`
- [x] Profile settings (name, email)
- [x] Theme preferences (light/dark/system)
- [x] Language preferences (mn/en)
- [x] Summary length preferences
- [x] Vocabulary management (existing)

### 9.2 Notifications
- [ ] Email notifications (task due, processing complete)
- [ ] In-app notifications
- [ ] Notification preferences

### 9.3 Integrations (Future)
- [ ] Google Calendar (import meetings)
- [ ] Google Drive (store recordings)
- [ ] Slack (notifications)
- [ ] Notion (export minutes)

**Acceptance criteria:**
- Settings page functional
- Preferences saved
- Vocabulary works

---

## PHASE 10 — Production Readiness

### 10.1 Security
- [ ] Security audit (auth, permissions, data access)
- [ ] Rate limiting
- [ ] Input validation
- [ ] XSS prevention
- [ ] CSRF protection

### 10.2 Performance
- [ ] Optimize database queries
- [ ] Add caching (Redis)
- [ ] Lazy load components
- [ ] Image optimization
- [ ] Bundle size reduction

### 10.3 Accessibility
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Color contrast checks
- [ ] Focus indicators

### 10.4 Testing
- [ ] Unit tests for backend services
- [ ] Integration tests for API
- [ ] E2E tests (Playwright)
- [ ] Mobile testing

### 10.5 Monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics (Plausible/PostHog)
- [ ] Uptime monitoring
- [ ] Logging

**Acceptance criteria:**
- Security audit passed
- Performance metrics acceptable
- Accessibility compliant
- Tests passing
- Monitoring active

---

## Current Sprint

**Phase 0** ✅ Complete

**Next:** Phase 1 — Design System & Application Shell

---

## Notes

- Each phase should be completed incrementally
- Verify functionality before marking tasks complete
- Update PROGRESS.md after each major milestone
- Do not skip testing
