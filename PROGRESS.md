# PROGRESS.md — Minuto Development Log

## 2026-11-06 — Phase 1: Design System & Application Shell (In Progress)

### Task 1.1 Complete: Sidebar Navigation Component ✅
**Created:** `frontend/src/components/layout/sidebar.tsx`
- Fixed left sidebar (240px), collapsible to 64px
- Navigation: Dashboard, New Meeting, My Meetings, Action Items, AI Search, Templates
- Footer: Settings, user profile, logout
- Active state indicator (`bg-primary/10 text-primary`)
- Hover states, Lucide icons
- Follows DESIGN_SYSTEM.md

### Task 1.2 Complete: AppShell Component ✅
**Created:** `frontend/src/components/layout/app-shell.tsx`
- Sidebar + main content layout wrapper
- Collapsible sidebar state management
- Smooth transitions

### Task 1.3 Complete: Migrate Pages to AppShell ✅
**Modified pages:**
- `/dashboard` — Uses AppShell ✅
- `/upload` — Uses AppShell ✅
- `/ask` — Uses AppShell ✅
- `/meetings/[id]` — Uses AppShell ✅
- `/meetings/[id]/live` — Uses AppShell ✅

**Kept old layout (no sidebar):**
- `/` (Landing page) — Marketing page, no sidebar needed
- `/login` — Auth page, no sidebar needed

### Build Status
- ✅ TypeScript build passed
- ✅ No lint errors
- ✅ All pages compile successfully

### Task 1.4 Complete: Design Tokens ✅
**Created:** `frontend/src/lib/design-tokens.ts`
- Colors (semantic: background, foreground, primary, success, warning, etc.)
- Spacing (4px increments: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px)
- Typography (fontSize, fontWeight, lineHeight)
- Border radius, shadows, transitions, breakpoints, layout constants

**Updated:** `frontend/src/app/globals.css`
- Added `--success` and `--warning` CSS variables (light + dark mode)
- Updated primary color to indigo (oklch 0.55 0.18 264)
- Refined muted, border colors with subtle blue tint
- Improved dark mode contrast

### Task 1.5 Complete: Dark Mode Toggle ✅
**Created:** `frontend/src/hooks/use-theme.ts`
- Theme state management (light/dark/system)
- localStorage persistence
- System theme detection
- Toggle function

**Updated:** `frontend/src/components/layout/sidebar.tsx`
- Added theme toggle button in footer
- Moon/Sun icon based on current theme
- Collapsible support (icon only when collapsed)

### Task 1.6 Complete: Polish States ✅
**Created unified state components:**
- `components/ui/loading-state.tsx` — Loading spinner with message
- `components/ui/empty-state.tsx` — Icon, title, description, action
- `components/ui/error-state.tsx` — Error message with action

**Applied to pages:**
- Dashboard: Error state, "no results" empty state
- Meeting detail: Loading state, error state

### Phase 1 Complete ✅
All tasks finished:
- ✅ Sidebar navigation (collapsible, 240px/64px)
- ✅ AppShell layout wrapper
- ✅ Migrated all pages to AppShell
- ✅ Design tokens (colors, spacing, typography)
- ✅ Dark mode toggle
- ✅ Unified loading/empty/error states

---

## 2026-11-06 — Phase 2: Dashboard & Meeting Library (In Progress)

### Task 2.1 Complete: Meeting Rename ✅
**Updated:** `frontend/src/app/dashboard/page.tsx`
- Added inline edit for meeting title
- Pencil icon button to trigger edit mode
- Enter to save, Escape to cancel
- API call to update meeting title

### Task 2.2 Complete: List/Grid View Toggle ✅
**Updated:** `frontend/src/app/dashboard/page.tsx`
- Added viewMode state (grid/list)
- Added toggle buttons in filter bar
- Created MeetingListItem component for list view
- Grid view shows cards, list view shows rows

### Task 2.3 Complete: Meeting Archive ✅
**Backend changes:**
- Added `archived` boolean field to Meeting model
- Added archive_meeting() function to meeting_store
- Added POST /api/meetings/{id}/archive endpoint
- Added POST /api/meetings/{id}/unarchive endpoint
- Added include_archived query param to list_meetings

**Frontend changes:**
- Added archive toggle button in filter bar
- Added archive button to MeetingCard and MeetingListItem
- Added handleArchive/handleUnarchive functions
- Added archiveMeeting/unarchiveMeeting API calls

### Task 2.4 Complete: Dedicated /meetings Page ✅
**Created:** `frontend/src/app/meetings/page.tsx`
- Full-featured meeting management page
- Pagination (12 items per page)
- Bulk selection with checkboxes
- Bulk delete and bulk archive actions
- All filters: search, status, sort, view mode, archive toggle
- Grid and list views
- Inline rename functionality
- Responsive design

### Phase 2 Complete ✅
All tasks finished:
- ✅ Meeting rename (inline edit)
- ✅ Meeting delete with confirmation
- ✅ Meeting archive (soft delete)
- ✅ Bulk actions (select multiple)
- ✅ Dedicated /meetings page
- ✅ Pagination
- ✅ Advanced filters and sorting
- ✅ List/grid view toggle
- ✅ Backend endpoints (update, archive)

### Next: Phase 3 — Recording & Upload Refinement

---

## 2026-11-06 — Phase 3: Recording & Upload Refinement (In Progress)

### Task 3.1 Complete: Live Recording UI ✅
**Created:** `frontend/src/components/ui/audio-waveform.tsx`
- Real-time audio waveform visualization
- Canvas-based animation with smooth transitions

**Updated:** `frontend/src/app/meetings/[id]/live/content.tsx`
- Added waveform display during recording
- Improved status cards (4 cards: audio level, sent, confirmed, time)
- Added audio level percentage display
- Added delivery confirmation percentage

### Task 3.2 Complete: Better Upload Progress ✅
**Updated:** `frontend/src/app/upload/page.tsx`
- Added audio duration detection and display
- Show file size and duration in preview
- Loading state while detecting duration

### Next Tasks
- Task 3.3: Audio input device selector
- Task 3.4: Bookmark button (timestamp markers)
- Task 3.5: Batch upload (multiple files)

---

## 2026-11-06 — Phase 4: Meeting Details Enhancement (In Progress)

### Task 4.1 Complete: Transcript Inline Editing ✅
**Backend changes:**
- Added TranscriptSegmentUpdate and TranscriptUpdate schemas
- Added update_transcript_segments function to meeting_store
- Added PUT /api/meetings/{id}/transcript endpoint
- Support updating text and speaker per segment

**Frontend changes:**
- Added edit mode toggle in transcript tab
- Click segment to edit text and speaker
- Save/cancel buttons for each edit
- Added updateTranscript API call

### Next Tasks
- Task 4.2: Summary controls (regenerate, length, language)
- Task 4.3: Audio player improvements
- Task 4.4: Action items with status tracking

---

## 2026-11-06 — Phase 0: Project Audit Complete ✅

### What was done
- Full codebase inspection (backend + frontend)
- Identified all working features and missing functionality
- Created 5 documentation files:
  - `PRODUCT_REQUIREMENTS.md` — Product overview, user journeys, tech stack
  - `DESIGN_SYSTEM.md` — Visual design specifications
  - `IMPLEMENTATION_PLAN.md` — Architecture, 10 development phases
  - `TODO.md` — Detailed task checklist
  - `PROGRESS.md` — This file

### Current State Summary

**Working Features:**
- ✅ User auth (JWT)
- ✅ Live recording (WebSocket)
- ✅ Audio upload
- ✅ Speech-to-text (Qwen-Omni via tokenhub.mn)
- ✅ AI meeting minutes (Qwen LLM)
- ✅ Transcript display
- ✅ Ask Minuto (AI chat with citations)
- ✅ DOCX export
- ✅ Dashboard with search/filters
- ✅ Landing page

**Missing Features (high priority):**
- ❌ Sidebar navigation (currently top navbar)
- ❌ Transcript editing
- ❌ Summary regeneration
- ❌ Central action items page
- ❌ PDF export
- ❌ Dark mode
- ❌ Meeting templates
- ❌ Workspaces/projects

### Architecture Decisions

**AI Provider:** Using tokenhub.mn (Gerege Systems) for both ASR and LLM
- ASR: Qwen-Omni (qwen3-omni-flash) — 30-second chunks, parallel processing
- LLM: Qwen (qwen3.7-plus) — structured JSON output for meeting minutes

**Database:** PostgreSQL on Render (free tier)
- Tables: users, meetings, contacts
- JSON columns for transcript, minutes, participants

**Frontend:** Next.js 15 App Router
- TypeScript throughout
- shadcn/ui components
- Tailwind CSS

### Deployment Status

| Service | URL | Status |
|---------|-----|--------|
| Backend | https://minuto-backend.onrender.com | ✅ Live |
| Frontend | https://mongolian-ai-minutes.vercel.app | ✅ Live |
| GitHub (backend) | https://github.com/shinezayam/minuto | ✅ Active |
| GitHub (frontend) | https://github.com/shinezayam/minuto-frontend | ✅ Active |

### Issues Resolved

**Backend 404 Error (2026-11-06)**
- **Problem:** All endpoints returning 404, status 127 in logs
- **Root cause:** Render Start Command was `.venv/bin/python -m uvicorn ...` but Render native Python runtime doesn't use `.venv` prefix
- **Fix:** Changed Start Command to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Note:** `render.yaml` was updated but dashboard setting also needed manual update

### Next Steps

**Phase 1 — Design System & Application Shell**
1. Create sidebar navigation component
2. Migrate from top navbar to sidebar layout
3. Implement design tokens
4. Add dark mode support

**Estimated timeline:** 2-3 days

---

## Pre-Phase 0 History

### Phase 1 (MVP) — Complete ✅
- FastAPI backend with WebSocket support
- Next.js frontend with recording/upload
- Demo ASR and LLM providers
- Basic meeting detail page
- DOCX export
- 15 backend tests passing

### Phase 2 (ASR Integration) — Complete ✅
- Integrated Qwen-Omni API for speech-to-text
- 30-second audio chunks, parallel processing
- Live transcription during recording
- Speaker diarization (basic)

### Phase 3 (LLM Integration) — Complete ✅
- Integrated Qwen LLM for meeting minutes
- Structured JSON output (summary, topics, decisions, action items, Q&A)
- Source citation for decisions
- Ask Minuto AI chat

### Phase 4 (Database & Auth) — Complete ✅
- PostgreSQL database on Render
- JWT authentication
- User registration/login
- Meeting ownership

### Phase 5 (Deployment) — Complete ✅
- Backend deployed to Render
- Frontend deployed to Vercel
- Landing page added
- Dashboard improvements

---

## 2026-11-08 — Phase 4-6 Complete

### Phase 4: Meeting Details Enhancement ✅
- Transcript inline editing (segment text, speaker)
- Summary controls (regenerate, edit, copy)
- Custom audio player with playback speed (0.5x-2x)
- Transcript sync with audio playback
- Action items management (checkbox, edit owner/due date)
- Meeting title inline editing

### Phase 5: Formal Meeting Minutes ✅
- PDF export support (fpdf2)
- GET /api/meetings/{id}/export.pdf endpoint
- Frontend PDF download button
- DOCX + PDF export options

### Phase 6: Action Management ✅
- Central Action Items page (/actions)
- Stats cards: total, open, done, overdue
- Filter by status: all, open, done, overdue
- Search by task, meeting title, owner
- Toggle status with checkbox
- Link to source meeting
- Overdue items highlighted in red

---

## 2026-11-12 — Phase 7: Advanced AI Features (In Progress)

### Phase 7.1: Cross-Meeting Search ✅
- Filter panel UI on /ask page
- Date range filter (from/to)
- Participant filter
- Backend: date_from, date_to, meeting_ids, participant filters

### Phase 7.2: Hybrid Search ✅
- Mongolian stemming (нөхцөл дагавар авах)
- Business term synonyms (хурал/уулзалт, шийдвэр/тогтоол, даалгавар/үүрэг)
- BM25-inspired scoring (coverage + density)
- Better search relevance for Mongolian text

### Phase 7.3: AI Enhancements (Topic Segmentation) ✅
- Create topic_segmentation.py service
- LLM-powered topic detection from transcript
- POST /api/meetings/{id}/topics endpoint
- Frontend: "Сэдвүүд үүсгэх" button in transcript tab
- Display topics with title, description, timestamps
- Click topic to seek to that segment in transcript/audio

---

## 2026-11-12 — Phase 8: Templates & Workspaces (In Progress)

### Phase 8.1: Meeting Templates ✅
- MeetingTemplate model with sections, custom_prompt, icon
- Default templates: Албан хурал, Daily Standup, Brainstorming, Ярилцлага, Сургалт, Төслийн төлөв
- Templates service with CRUD operations
- API endpoints: GET/POST /api/templates, DELETE /api/templates/{id}
- /templates page with template library
- Create custom templates with name, description, icon, sections

### Phase 8.2: Workspaces ✅
- Workspace model (personal/organization)
- WorkspaceMember model with role-based access (owner/admin/editor/viewer)
- Personal workspace auto-created for each user
- Organization workspace creation
- Invite members by email
- Remove members
- Role-based permissions

### Phase 8.3: Projects/Folders ✅
- Project model for organizing meetings
- Create projects with colors
- Delete projects
- Workspace-ийн дотор project-ууд
- Role-based access (admin+ can manage)

---

## 2026-11-12 — Phase 9: Settings (In Progress)

### Phase 9.1: Settings Page ✅
- Tabbed interface (Profile, Preferences, Vocabulary)
- Profile: edit name, view email
- Preferences: theme (light/dark/system), language (mn/en), summary length
- Save preferences to localStorage
- updateProfile API function

### Next: Phase 10 — Production Readiness

## Known Limitations

1. **Speaker diarization is basic** — Per-segment labels merged by LLM, not true diarization
2. **No workspaces** — Single-user, no team collaboration
3. **No templates** — Fixed meeting minutes format
4. **Render free tier limits** — Backend may sleep after inactivity
5. **PDF Cyrillic support** — Limited (romanized text)

## Future Considerations

- **Vector database** for semantic search (Phase 7)
- **Redis** for caching and rate limiting
- **Sentry** for error monitoring
- **Google Calendar** integration for meeting imports
- **Mobile app** (React Native or PWA)
