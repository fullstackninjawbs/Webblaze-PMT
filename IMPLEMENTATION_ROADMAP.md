# Implementation Roadmap

Each phase ends with a working, demo-able slice. Estimates assume 1–2
full-stack developers; adjust to your team size.

## Phase 0 — Project Setup (2–3 days)
- Init monorepo (`server/`, `client/`) or two repos
- ESLint, Prettier, Husky + lint-staged, `.env.example`
- MongoDB connection, base Express app, error handler, logger
- Vite + React app skeleton, routing, Redux store, base RTK Query api
- CI pipeline skeleton (lint + test on PR)

## Phase 1 — Auth & RBAC Foundation (3–5 days)
- User model, register (admin-only), login, JWT + refresh flow
- `auth.middleware`, `rbac.middleware`, `permissions.js`
- Frontend: Split-layout login page (branding + form), context-aware validation, "Remember me"
- `ProtectedRoute`, `RoleGuard` to enforce role-based access
- Frontend Layouts: Role-specific sidebars and dashboard heroes (Admin, PM, TL, TM)
- **Demo:** Users can log in and see a fully personalized, role-specific dashboard shell

## Phase 2 — Clients & Projects (4–6 days)
- Client CRUD (Admin/PM): Advanced Drawers for identity, contact, business mapping
- Project CRUD, client linkage, status enum, team assignment via Split-Layout Modals
- Project overview page with Role-aware headers, KPIs (Budget, Received, Pending for Admin/PM only) and Tabbed sections
- **Demo:** Admin/PM can onboard a client and create a project, viewing restricted KPIs properly.

## Phase 3 — Milestones & Tasks (5–7 days)
- Milestone CRUD + hour-cap enforcement (Enhanced UI with cards and visual progress)
- Task CRUD, strict Hour Cap enforcement, and blocking validation
- Task list views with department and status filtering
- Team Tasks view: Unassigned vs Assigned panel for Team Leads
- **Demo:** full client → project → milestone → task → assignment chain works with visual hour caps

## Phase 4 — Time Tracking & Progress (5–7 days)
- Timer start/stop, TimeLog model, active-timer endpoint
- Task status workflow (Assigned → In Progress → In Review → Completed)
- Aggregation pipelines: task/milestone/project progress from logged hours
- Optional: Socket.io for live timer state
- **Demo:** a team member can start a timer, complete a task, and see
  milestone/project progress update

## Phase 5 — Team Todo, Dashboard, Team Time Tracking (4–5 days)
- Team Todo CRUD + dashboard "Team Todo Overview" table
- Dashboard project summary cards (total/active/on-hold/maintenance)
- Team Time Tracking admin/PM view (all members, active + logged)
- **Demo:** management dashboard is live and reflects real data

## Phase 6 — Releases & Invoices (4–5 days)
- Release CRUD, release sheet on dashboard + project view
- Invoice model, payment recording, pending/received computation
- Strict RBAC + service-layer field stripping for financial data
- **Demo:** Admin/PM manage releases and invoices; TL/TM never see $ figures

## Phase 7 — Status Updates & Attachments (3–4 days)
- Daily status + project status submission and history views
- File upload (multer → S3 or local), attachment linking to
  project/milestone/task/release
- **Demo:** full proposal feature set is functionally complete

## Phase 8 — Hardening, Testing, Docs, Deployment (5–7 days)
- Backend: Jest + Supertest coverage on all modules (target ≥70% on services)
- Frontend: RTL tests on critical flows (login, task assignment, timer)
- Security pass: helmet, rate limiting, input sanitization, dependency audit
- Load-test key endpoints (dashboard, time-logs)
- Finalize all `.md` docs (this set + `CHANGELOG.md`, `CONTRIBUTING.md`)
- Deployment: Dockerize both apps, set up staging + prod envs, CI/CD to deploy
  on merge to `main`

## Suggested total timeline
~7–9 weeks for a 2-developer team, including buffer for review/QA cycles.

## Definition of Done (every phase)
- [ ] Feature covered by RBAC matrix and enforced server-side
- [ ] Validation schemas on all inputs
- [ ] Unit/integration tests written
- [ ] Errors handled via centralized `ApiError`/`errorHandler`
- [ ] README/API_ENDPOINTS updated if the contract changed
- [ ] PR reviewed against `CODING_STANDARDS.md` checklist
