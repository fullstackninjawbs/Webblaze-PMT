# API Endpoints

Base URL: `/api/v1`. All responses use a consistent envelope:
`{ success, data, message, error }`. All list endpoints support
`?page=&limit=&sort=&filter[...]=`.

## Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | `/auth/register` | Admin only (creates users) |
| POST | `/auth/login` | Public |
| POST | `/auth/refresh` | Public (valid refresh cookie) |
| POST | `/auth/logout` | Authenticated |
| GET | `/auth/me` | Authenticated |

## Users
| Method | Endpoint | Access |
|---|---|---|
| GET | `/users` | Admin |
| GET | `/users/:id` | Admin, self |
| PATCH | `/users/:id` | Admin |
| PATCH | `/users/:id/role` | Admin |
| DELETE | `/users/:id` | Admin |

## Clients
| Method | Endpoint | Access |
|---|---|---|
| GET/POST | `/clients` | Admin, PM |
| GET/PATCH/DELETE | `/clients/:id` | Admin, PM |

## Projects
| Method | Endpoint | Access |
|---|---|---|
| GET | `/projects` | All (scope-filtered) |
| POST | `/projects` | Admin, PM |
| GET | `/projects/:id` | All (scope-filtered) |
| PATCH/DELETE | `/projects/:id` | Admin, PM |
| GET | `/projects/:id/overview` | All (scope-filtered) |
| GET | `/projects/:id/reports` | Admin, PM |

## Milestones
| Method | Endpoint | Access |
|---|---|---|
| GET/POST | `/projects/:projectId/milestones` | GET: all scoped · POST: Admin/PM |
| GET/PATCH/DELETE | `/milestones/:id` | PATCH/DELETE: Admin/PM |

## Tasks
| Method | Endpoint | Access |
|---|---|---|
| GET/POST | `/milestones/:milestoneId/tasks` | GET: scoped · POST: Admin/PM/TL |
| GET/PATCH/DELETE | `/tasks/:id` | scoped |
| PATCH | `/tasks/:id/assign` | Admin, PM, TL |
| PATCH | `/tasks/:id/status` | assignee, TL, PM, Admin |

## Time Tracking
| Method | Endpoint | Access |
|---|---|---|
| POST | `/tasks/:taskId/timer/start` | assignee |
| POST | `/tasks/:taskId/timer/stop` | assignee |
| GET | `/time-logs` | scoped (own for TM, team for TL, all for PM/Admin) |
| GET | `/time-logs/active` | current running timers, scoped |

## Team Todo
| Method | Endpoint | Access |
|---|---|---|
| GET/POST | `/team-todos` | scoped |
| PATCH/DELETE | `/team-todos/:id` | owner, TL, PM, Admin |

## Releases
| Method | Endpoint | Access |
|---|---|---|
| GET/POST | `/projects/:projectId/releases` | GET: scoped · POST: Admin/PM/TL |
| GET/PATCH/DELETE | `/releases/:id` | scoped |

## Invoices & Financials
| Method | Endpoint | Access |
|---|---|---|
| GET/POST | `/projects/:projectId/invoices` | Admin, PM |
| GET/PATCH/DELETE | `/invoices/:id` | Admin, PM |
| POST | `/invoices/:id/payments` | Admin, PM |

## Status Updates
| Method | Endpoint | Access |
|---|---|---|
| GET/POST | `/status-updates?type=daily\|project` | scoped |

## Attachments
| Method | Endpoint | Access |
|---|---|---|
| POST | `/attachments` (multipart) | scoped |
| GET | `/attachments?relatedType=&relatedId=` | scoped |
| DELETE | `/attachments/:id` | uploader, PM, Admin |

## Dashboard
| Method | Endpoint | Access |
|---|---|---|
| GET | `/dashboard/summary` | project counts by status |
| GET | `/dashboard/team-todo` | all members' todos, PM/Admin |
| GET | `/dashboard/release-sheet` | upcoming releases |
