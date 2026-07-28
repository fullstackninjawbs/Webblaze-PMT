# Architecture

## 1. System Overview

```
Client
  ↓
Project
  ↓
Milestone (hour-capped)
  ↓
Task (Assigned → In Progress → In Review → Completed)
  ↓
Team Assignment
  ↓
Timer & Time Tracking
  ↓
Task Review → Milestone Progress → Project Progress
  ↓
Release & Reporting → Invoicing
```

This lifecycle (from the proposal's §17) is the backbone of the data model —
build bottom-up in this order so every layer has what it needs from the one
below it.

## 2. High-Level Architecture

```
┌────────────────────┐        ┌────────────────────────┐        ┌──────────────┐
│   React Frontend    │ <----> │   Express REST API      │ <----> │   MongoDB     │
│ (Vite, RTK Query)    │  HTTPS │ (Node.js, JWT auth)      │  ODM   │  (Mongoose)   │
└────────────────────┘        └────────────────────────┘        └──────────────┘
                                        │
                                        ├── Auth middleware (JWT verify)
                                        ├── RBAC middleware (role + resource check)
                                        ├── Validation middleware (Zod/Joi schemas)
                                        ├── Error-handling middleware (centralized)
                                        ├── File upload handler (multer → S3)
                                        └── Socket.io gateway (timers, live dashboard)
```

## 3. Backend Folder Structure (feature-first, not pure MVC)

```
server/
├── src/
│   ├── config/              # db.js, env.js, s3.js, socket.js
│   ├── modules/
│   │   ├── auth/             # login, refresh, logout, controllers/services/routes
│   │   ├── users/            # user CRUD, role assignment
│   │   ├── clients/
│   │   ├── projects/
│   │   ├── milestones/
│   │   ├── tasks/
│   │   ├── timeTracking/     # timer start/stop, logs
│   │   ├── teamTodo/
│   │   ├── releases/
│   │   ├── invoices/
│   │   ├── statusUpdates/    # daily + project status
│   │   └── attachments/
│   │       each module contains:
│   │       ├── <module>.model.js
│   │       ├── <module>.controller.js
│   │       ├── <module>.service.js
│   │       ├── <module>.routes.js
│   │       ├── <module>.validation.js
│   │       └── <module>.test.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── rbac.middleware.js
│   │   ├── validate.middleware.js
│   │   └── errorHandler.middleware.js
│   ├── utils/                # asyncHandler, ApiError, ApiResponse, logger
│   ├── app.js
│   └── server.js
├── .env.example
└── package.json
```

## 4. Frontend Folder Structure

```
client/
├── src/
│   ├── app/                  # store.js, RTK Query base api
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── clients/
│   │   ├── projects/
│   │   ├── milestones/
│   │   ├── tasks/
│   │   ├── timer/
│   │   ├── teamTodo/
│   │   ├── releases/
│   │   ├── invoices/
│   │   └── statusUpdates/
│   │       each contains: components/, api.slice.js, hooks.js
│   ├── components/common/    # Table, Modal, RoleGuard, ProtectedRoute
│   ├── routes/                # route config + role-based route guards
│   ├── layouts/               # AdminLayout, PMLayout, TLLayout, MemberLayout
│   ├── hooks/
│   ├── utils/
│   └── main.jsx
```

## 5. Cross-Cutting Concerns

- **Authentication:** JWT access token (short-lived, ~15min) + refresh token
  (httpOnly cookie, ~7d). Refresh rotation on use.
- **Authorization:** every protected route runs `auth.middleware` then
  `rbac.middleware(resource, action)`. See `RBAC_MATRIX.md`.
- **Financial data isolation:** budget/received/pending/invoice fields are
  stripped from API responses at the *service* layer (not just hidden in the
  UI) for Team Lead / Team Member roles, so no financial data ever leaves the
  server for those roles.
- **Progress calculation:** derived, not stored redundantly where avoidable —
  Task → Milestone → Project progress is computed from `TimeLog` aggregates
  (estimated vs. logged hours) via a scheduled job or on-read aggregation
  pipeline, cached briefly if performance requires it.
- **Milestone hour cap:** enforced server-side in `tasks.service.js` before
  insert — reject task creation once `SUM(task.estimatedHours) === milestone.estimatedHours`.
- **File attachments:** stored in S3 (or local disk in dev), metadata
  (uploadedBy, relatedProject/Task, uploadDate) stored in Mongo.
- **Realtime (optional but recommended):** Socket.io room per project to push
  live timer state and task status changes to the dashboard/Team Todo view.
- **Logging & monitoring:** Winston for structured logs, Morgan for HTTP
  request logs in dev, error tracking (Sentry) recommended in production.
