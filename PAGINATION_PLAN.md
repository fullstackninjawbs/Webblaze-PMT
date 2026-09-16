# Pagination Plan — All Tables

## Why This Needs a Standard, Not a One-Off Fix

Right now every table you've built (Projects, Milestones, Tasks, Team Todo,
Releases, Invoices, Billed Hours, Users, etc.) likely fetches its full
dataset in one call. Fixing this table-by-table means five different
pagination behaviors across the app. Do it once as a shared pattern
(backend helper + frontend component), then apply it everywhere — that's
the only way this stays consistent as you add more tables later.

## 1. Backend Pattern (build once, reuse everywhere)

**Query params, standardized across every list endpoint:**
```
GET /projects?page=1&limit=20&sort=-createdAt&filter[status]=active
```
- `page` — 1-indexed, default `1`
- `limit` — default `20`, hard cap at `100` (never let the client request
  an unbounded page size)
- `sort` — field name, `-` prefix for descending
- `filter[...]` — existing filters (status, department, etc.) compose
  *with* pagination, not instead of it — this matters (see §4)

**Response envelope — extend the existing shape with a `meta` block:**
```ts
{
  success: true,
  data: [...],
  meta: {
    page: 1,
    limit: 20,
    total: 143,        // total matching documents, post-filter, pre-page
    totalPages: 8
  }
}
```

**Reusable helper** — one function every list controller calls, instead of
copy-pasting `.skip().limit()` in ten places:
```ts
// src/utils/paginate.ts
async function paginate(model, filter, { page, limit, sort }) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    model.find(filter).sort(sort).skip(skip).limit(limit),
    model.countDocuments(filter)
  ]);
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
```
Every list controller becomes: build the RBAC-scoped `filter` (as they
already do today), then call `paginate(Model, filter, parsedQuery)` instead
of `Model.find(filter)`.

## 2. Frontend Pattern (build once, reuse everywhere)

**One reusable component**, not per-table pagination logic:
```
components/common/PaginatedTable/
  ├── PaginatedTable.tsx     # renders rows + pagination controls
  ├── usePagination.ts       # hook: reads/writes ?page=&limit= in the URL
  └── Pagination.tsx         # prev/next + page numbers + page-size selector
```
- **Sync page state to the URL** (`?page=2`), not just component state —
  this makes pages bookmarkable/shareable and survives a refresh, which
  matters once PM/Admin start filtering + paging through Billed Hours or
  reports.
- **Works with RTK Query directly** — `page`/`limit` become part of the
  query key, so RTK Query's caching handles page-to-page navigation without
  extra work: `useGetProjectsQuery({ page, limit, ...filters })`
- Every table component becomes: fetch via the paginated query hook, render
  rows, drop in `<Pagination meta={data.meta} />` at the bottom. No table
  should hand-roll its own page-number logic.

## 3. Full Table Inventory

Every one of these needs the same treatment — backend controller updated to
use `paginate()`, frontend swapped to `PaginatedTable`:

| # | Table | Endpoint | Notes |
|---|---|---|---|
| 1 | All Projects listing | `GET /projects` | + RBAC scope filter still applies underneath |
| 2 | Clients listing | `GET /clients` | |
| 3 | Milestone listing (per project) | `GET /projects/:id/milestones` | |
| 4 | Task listing (per milestone) | `GET /milestones/:id/tasks` | |
| 5 | Task listing (Tasks tab, project-wide) | `GET /projects/:id/tasks` | |
| 6 | Team Todo (personal) | `GET /team-todos` | |
| 7 | Team Todo Overview (dashboard) | `GET /dashboard/team-todo` | grouped-by-user — paginate per user or cap rows shown, see §5 |
| 8 | Releases listing | `GET /projects/:id/releases` | |
| 9 | Release Sheet (dashboard) | `GET /dashboard/release-sheet` | |
| 10 | Invoices listing | `GET /projects/:id/invoices` | |
| 11 | Users listing | `GET /users` | Admin only |
| 12 | Team Time Tracking | `GET /time-logs` | high-volume table, prioritize this one |
| 13 | Project Status — run time table | `GET /projects/:id/status/run-time` | |
| 14 | Billed Hours tab | `GET /billed-hours` | + date filters compose with pagination |
| 15 | Attachments list | `GET /attachments` | |
| 16 | Daily/Project Status history | `GET /status-updates` | |

## 4. Filters + Pagination Must Compose Correctly

The most common bug in this kind of retrofit: someone applies a filter,
gets 6 results, but the `meta.total` still says the old unfiltered count
because pagination and filtering were bolted on separately. Guard against
this explicitly:
- `total`/`totalPages` in `meta` must always reflect the **post-filter**
  count, never the whole collection
- Changing a filter must reset `page` back to `1` on the frontend (don't
  leave the user stranded on page 5 of a now-3-page result set)
- RBAC scope filters (department scoping from the last fix, project/task
  ownership scoping) are applied to the `filter` object **before** it
  reaches `paginate()` — pagination must never see unscoped data, even
  internally

## 5. Special Cases

- **Team Todo Overview** (dashboard, grouped by user) — this one isn't a
  flat list, it's grouped. Simplest fix: cap it at N todos per user (e.g. 5
  most urgent) rather than true pagination, OR paginate at the user level
  (20 users per page, all their todos shown). Decide based on real data
  volume — don't over-engineer this one specifically.
- **Dashboard summary cards** (Phase 5, project counts) — these are
  aggregates, not lists. No pagination needed here at all.

## 6. Implementation Order

1. Build the backend `paginate()` helper + response envelope change — one
   commit, no visible behavior change yet
2. Build the frontend `PaginatedTable` + `usePagination` hook against **one**
   table first (recommend Team Time Tracking — highest row count, most
   valuable to fix first) to prove the pattern end-to-end
3. Roll out to the rest of the inventory in §3, roughly in order of current
   row count (biggest tables first — that's where the missing pagination is
   actually hurting you today)
4. Handle the two special cases in §5 last, since they deviate from the
   standard pattern

## Acceptance Criteria

- [ ] Every table in §3 uses `paginate()` server-side and `PaginatedTable`
      client-side — no table left on a raw `.find()` with no limit
- [ ] `meta.total`/`totalPages` always reflect the post-filter,
      post-RBAC-scope count
- [ ] Changing a filter resets to page 1
- [ ] Page state is reflected in the URL and survives a refresh
- [ ] `limit` is capped server-side (e.g. 100) regardless of what the client requests
