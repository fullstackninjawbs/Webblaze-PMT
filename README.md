# Project Management & Team Operations Platform

Internal MERN-stack platform for managing clients, projects, milestones, tasks,
time tracking, releases, invoices, and project profitability — with strict
role-based access control (Admin, PM, Team Lead, Team Member).

This repo's planning docs are split into focused files so nothing gets missed
during implementation:

| Doc | Purpose |
|---|---|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Tech stack, folder structure, system design, middleware layers |
| [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) | Mongoose models, fields, relationships, enums |
| [`RBAC_MATRIX.md`](./RBAC_MATRIX.md) | Role → resource → permission matrix |
| [`API_ENDPOINTS.md`](./API_ENDPOINTS.md) | REST API spec grouped by resource |
| [`IMPLEMENTATION_ROADMAP.md`](./IMPLEMENTATION_ROADMAP.md) | Phased build plan with milestones |
| [`CODING_STANDARDS.md`](./CODING_STANDARDS.md) | Git workflow, linting, testing, security, review checklist |

## Tech Stack (proposed)

- **Frontend:** React 18 + Vite, Redux Toolkit + RTK Query, React Router, Tailwind CSS
- **Backend:** Node.js + Express.js, Mongoose (MongoDB)
- **Auth:** JWT (access + refresh tokens), bcrypt for password hashing
- **Realtime (optional, Phase 4+):** Socket.io for live timers / dashboard updates
- **File storage:** S3-compatible bucket (or local `/uploads` in dev) for attachments
- **Validation:** Zod or Joi on both API boundary and forms
- **Testing:** Jest + Supertest (backend), React Testing Library + Vitest (frontend)
- **Tooling:** ESLint, Prettier, Husky + lint-staged, Conventional Commits

## Quick Start (once scaffolded)

```bash
# Backend
cd server && npm install && npm run dev

# Frontend
cd client && npm install && npm run dev
```

Environment variables are documented in `CODING_STANDARDS.md § Environment Config`.

## Source Requirements

All functional requirements below are derived directly from the internal
proposal PDF (`Project_Management_Platform.pdf`) supplied by the company —
every module (roles, dashboard, projects, milestones, tasks, timers, team
todo, releases, invoices, statuses, attachments) maps 1:1 to a section there.
