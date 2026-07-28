# Coding Standards & Practices (Solo, Senior-Level)

No PR/review ceremony — you're the only committer. That doesn't lower the
bar, it raises it: there's no second pair of eyes, so the discipline has to
be self-enforced through tooling, types, and tests instead of review.

## 1. Language Choice — Use TypeScript, Not Plain JS

For a solo build of this size (10+ models, RBAC, financial data), TypeScript
pays for itself almost immediately: it catches the "forgot to strip
`totalBudget` for a Team Lead" class of bug at compile time instead of in
production. Assumption: both `server/` and `client/` are TypeScript. If you'd
rather stay on plain JS, everything below still applies minus the typing
sections.

- `strict: true` in `tsconfig.json`, no exceptions
- No `any` — if a shape is genuinely unknown, use `unknown` and narrow it
- Shared types (`Role`, `TaskStatus`, `MilestoneStatus`, DTOs) live in a
  `shared/` or `packages/types` folder imported by both server and client —
  single source of truth instead of two enums drifting apart

## 2. Git Workflow (Solo / Trunk-Based)

- `main` is always deployable. Work in short-lived branches
  (`feat/task-timer`, `fix/milestone-hour-cap`) merged back same-day where
  possible — the branch exists for atomic history, not for review gating.
- Conventional Commits, no exceptions — this is what powers your
  `CHANGELOG.md` generation later and makes `git log` actually useful to you
  in 3 months:
  ```
  feat(tasks): enforce milestone hour cap on create
  fix(auth): rotate refresh token on use
  refactor(invoices): extract payment calc into service
  ```
- Commit at logical checkpoints, not "wip" dumps — each commit should build
  and pass tests on its own. This is your safety net for `git bisect` later.
- Tag releases (`v0.1.0`, `v0.2.0`) as phases from `IMPLEMENTATION_ROADMAP.md`
  complete. Use semver even solo — it disciplines you to think about
  breaking vs. additive changes.

## 3. Self-Review Discipline (replaces PR review)

Before every commit, run through this — literally, out loud if it helps:
- [ ] Does this change cross an RBAC boundary? If yes, is it enforced in
      `rbac.middleware` AND stripped at the service layer, not just hidden
      in the UI?
- [ ] Did I add a test for the failure path, not just the happy path?
- [ ] Would I understand this code cold in 6 months with zero context?
- [ ] Any `console.log`, commented-out code, or TODO without a ticket/note?
- [ ] Did I run `tsc --noEmit`, lint, and the test suite before committing?

Set this up as a Husky `pre-commit` hook (lint-staged) and a `pre-push` hook
(full test suite) so the discipline is enforced by tooling, not memory.

## 4. Backend Conventions
- **Response envelope** (always):
  ```ts
  { success: true, data: {...}, message: "Task created" }
  { success: false, error: { code: "TASK_HOUR_CAP_EXCEEDED", message: "..." } }
  ```
- **Async handling:** wrap all controllers in `asyncHandler(fn)` — never bare
  `try/catch` scattered per route.
- **Custom errors:** throw `ApiError(statusCode, message, code)`; centralized
  `errorHandler.middleware.ts` formats the final response and logs with
  correlation ID (see §8).
- **Validation:** every route validates `req.body`/`req.params`/`req.query`
  against a Zod schema in `<module>.validation.ts` before hitting the
  controller. Infer TS types from the Zod schema (`z.infer<typeof schema>`)
  instead of hand-writing duplicate interfaces.
- **Service layer:** controllers stay thin — parse request, call service,
  return response. Business logic (hour-cap checks, progress calc, financial
  field stripping) lives in `<module>.service.ts`, fully unit-testable
  without spinning up Express.
- **No magic strings:** roles, statuses, departments as shared enums from
  `shared/types`, imported both sides.
- **Repository pattern (lightweight):** don't call `Model.find()` directly
  from services scattered everywhere — wrap Mongoose calls in a thin
  `<module>.repository.ts` so swapping query logic or adding caching later
  doesn't mean hunting through every service.

## 5. Frontend Conventions
- Feature-first folders (see `ARCHITECTURE.md`); no shared "God" reducer
- RTK Query for all server state — no manual `useEffect` + `fetch`
- Forms: React Hook Form + the same Zod schemas (via `shared/types`) used on
  the backend, for identical validation messages client and server side
- Centralize role checks in a `can(user, 'permission:key')` helper matching
  `RBAC_MATRIX.md` — never inline `if (user.role === 'admin')`
- Components: colocate `Component.tsx`, `Component.test.tsx`,
  `Component.module.css` (or Tailwind, no separate CSS) per component folder

## 6. Testing
- Backend: Jest + Supertest — unit tests for services (hour-cap logic,
  progress calc, financial stripping — this one especially, write it first),
  integration tests per route covering happy path + at least one
  RBAC-denied path
- Frontend: Vitest + React Testing Library on critical flows (login, task
  assignment, timer start/stop, invoice visibility per role)
- Target coverage: ≥70% on `services/` and `utils/` — enforce via
  `jest --coverage` threshold in `package.json`, not just aspiration
- Write the RBAC-denial test *before* the feature test for anything touching
  financial data — it's the one bug class that's expensive to find late

## 7. Security Checklist
- [ ] `helmet` for HTTP headers
- [ ] Rate limiting on `/auth/*` and write-heavy endpoints
- [ ] Passwords hashed with bcrypt (cost factor ≥10), never logged
- [ ] JWT secrets in env, rotated per environment, refresh tokens httpOnly + secure
- [ ] Input sanitization (NoSQL injection guard via schema validation, not string concat)
- [ ] File upload: type/size validation, virus-scan hook if feasible
- [ ] CORS locked to known frontend origins
- [ ] Dependency audit (`npm audit`) run before every release tag
- [ ] Financial fields never serialized for TL/Team Member, verified by test
- [ ] Secrets never committed — `git-secrets` or a pre-commit regex hook as backup

## 8. Observability (small but real, even solo)
- Structured logging (Winston, JSON format) with a request-scoped
  correlation ID (middleware sets `req.id`, included in every log line and
  the error response) — this is what saves you when a user reports "it broke"
  with no other detail
- `/health` endpoint checking DB connectivity, for uptime monitoring
- Graceful shutdown: catch `SIGTERM`, close Mongo connection and in-flight
  requests before exit — matters the moment you deploy behind any
  orchestrator (Docker, PM2, k8s)

## 9. Environment Config (`.env.example`)
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/pm_platform
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLIENT_URL=http://localhost:5173
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY=
S3_SECRET_KEY=
```
Never commit `.env`. Keep `.env.example` current — it's your own onboarding
doc when you come back to this in six months.

## 10. Documentation Discipline
- `README.md` — kept current with setup steps, updated same commit as any
  setup-affecting change
- `CHANGELOG.md` — generated/updated per tagged release from Conventional
  Commits (consider `standard-version` or `semantic-release` to automate it)
- `API_ENDPOINTS.md` / `DATABASE_SCHEMA.md` — updated in the same commit as
  any contract or schema change. Treat doc drift as a bug against
  future-you, not a nice-to-have.
- OpenAPI spec via `swagger-jsdoc` inline route annotations, or a committed
  Postman/Insomnia collection — pick one, keep it in sync

## 11. Deployment Readiness (Phase 8 target)
- [ ] Both apps Dockerized (`Dockerfile` + `docker-compose.yml` for local
      full-stack + Mongo)
- [ ] Multi-stage build for frontend (build → static serve via nginx or
      served through Express in prod)
- [ ] CI runs typecheck + lint + test on every push to `main` (still worth
      it solo — it's a safety net, not a gatekeeper)
- [ ] Basic uptime/error monitoring wired (e.g. Sentry free tier) before
      real users touch it
