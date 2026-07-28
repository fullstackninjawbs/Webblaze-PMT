# Role-Based Access Control Matrix

Legend: **F** = Full access · **A** = Assigned/own scope only · **R** = Read-only · **✗** = No access

| Resource | Admin | PM | Team Lead | Team Member |
|---|---|---|---|---|
| Users & Roles | F | ✗ | ✗ | ✗ |
| Clients | F | F | ✗ | ✗ |
| Projects (all) | F | F | A (assigned) | A (assigned) |
| Milestones | F | F | R (assigned projects) | R (assigned projects) |
| Tasks — create/assign | F | F | A (within team) | ✗ |
| Tasks — view/update own | F | F | A | A |
| Timers / Time Tracking | F | F (view all) | A (own + team) | A (own only) |
| Team Todo | F | F | A | A |
| Releases | F | F | A (assigned) | R (assigned) |
| Invoices & Payments | F | F | ✗ | ✗ |
| Project Budget / Financials | F | F | ✗ | ✗ |
| Reports | F | F | ✗ (team-level only) | ✗ |
| Daily / Project Status | F (view all) | F (view all) | A (own + submit) | A (own + submit) |
| File Attachments | F | F | A (assigned scope) | A (assigned scope) |

## Enforcement points (defense in depth)

1. **Route middleware** — `rbac.middleware(resource, action)` on every route.
2. **Service layer** — financial fields (`totalBudget`, `receivedAmount`,
   `pendingAmount`, invoice data) are explicitly omitted when serializing for
   `team_lead` / `team_member`, not just hidden by the frontend.
3. **Scope filters** — TL/Team Member queries are always additionally filtered
   by `project.team contains req.user._id` or `task.assignedTo === req.user._id`
   at the query-builder level, so no ID-guessing can leak another team's data.
4. **Frontend route guards** — `RoleGuard` component + route config hide UI
   entry points, but this is UX only; it is never the source of truth.

## Suggested permission constants (backend)

```js
// src/config/permissions.js
export const ROLES = ['admin', 'pm', 'team_lead', 'team_member'];

export const PERMISSIONS = {
  'clients:manage':        ['admin', 'pm'],
  'projects:manage':       ['admin', 'pm'],
  'projects:view':         ['admin', 'pm', 'team_lead', 'team_member'], // scope-filtered
  'milestones:manage':     ['admin', 'pm'],
  'tasks:create':          ['admin', 'pm', 'team_lead'],
  'tasks:view':            ['admin', 'pm', 'team_lead', 'team_member'], // scope-filtered
  'invoices:manage':       ['admin', 'pm'],
  'financials:view':       ['admin', 'pm'],
  'users:manage':          ['admin'],
  'reports:view':          ['admin', 'pm'],
};
```
