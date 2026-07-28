# Database Schema (MongoDB / Mongoose)

All `ObjectId` fields are `ref`s enabling `.populate()`. Timestamps
(`createdAt`/`updatedAt`) are enabled on every schema via `{ timestamps: true }`.

## User
```
{
  name: String, required
  email: String, required, unique
  password: String, required (bcrypt hash)
  role: enum ['admin','pm','team_lead','team_member'], required
  department: enum ['design','development','seo'], optional
  isActive: Boolean, default true
  avatarUrl: String
}
```

## Client
```
{
  name: String, required
  email: String
  address: String
  contactNumber: String
  country: String
  companyName: String
  source: enum ['upwork','direct']
  billingType: enum ['hourly','fixed']
  createdBy: ObjectId(User)
}
```

## Project
```
{
  name: String, required
  client: ObjectId(Client), required
  totalBudget: Number
  description: String
  type: String
  status: enum ['active','on_hold','maintenance','completed'], default 'active'
  team: [ObjectId(User)]
  createdBy: ObjectId(User)
}
```
> `totalBudget`, and all financial rollups, are excluded from JSON output for
> `team_lead` / `team_member` via a Mongoose `toJSON` transform gated on the
> requester's role (passed via query context / a thin serializer, not schema-static).

## Milestone
```
{
  project: ObjectId(Project), required
  title: String, required
  estimatedHours: Number, required
  startDate: Date
  endDate: Date
  status: enum ['not_started','in_progress','on_hold','completed','cancelled'], default 'not_started'
}
```
Virtual/derived: `spentHours` = sum of TimeLog durations for tasks under this milestone.

## Task
```
{
  milestone: ObjectId(Milestone), required
  title: String, required
  description: String
  department: enum ['design','development','seo']
  estimatedHours: Number, required
  startDate: Date
  endDate: Date
  assignedTo: ObjectId(User)
  status: enum ['assigned','in_progress','in_review','completed'], default 'assigned'
  attachments: [ObjectId(Attachment)]
  createdBy: ObjectId(User)   # TL/PM who created it
}
```
Server-side rule: on create, reject if
`SUM(sibling tasks' estimatedHours) + this.estimatedHours > milestone.estimatedHours`.

## TimeLog (Task Timer)
```
{
  task: ObjectId(Task), required
  user: ObjectId(User), required
  startTime: Date, required
  endTime: Date
  durationSeconds: Number   # computed on stop
  status: enum ['running','stopped']
}
```

## TeamTodo
```
{
  user: ObjectId(User), required
  title: String, required
  relatedProject: ObjectId(Project)
  estimatedTime: Number
  status: enum ['pending','in_progress','done'], default 'pending'
  dueDate: Date
}
```

## Release
```
{
  project: ObjectId(Project), required
  department: enum ['design','development','seo']
  teamMember: ObjectId(User)
  details: String
  releaseDate: Date
  status: enum ['planned','in_progress','released','delayed'], default 'planned'
  relatedFiles: [ObjectId(Attachment)]
}
```

## Invoice
```
{
  project: ObjectId(Project), required
  totalBudget: Number
  receivedAmount: Number, default 0
  pendingAmount: Number   # derived: totalBudget - receivedAmount
  status: enum ['unpaid','partially_paid','paid'], default 'unpaid'
  paymentDetails: [{ amount: Number, date: Date, method: String, note: String }]
}
```
Access: `admin`, `pm` only — enforced in `rbac.middleware` and stripped at the
service layer as a defense-in-depth measure.

## StatusUpdate (Daily / Project status)
```
{
  user: ObjectId(User), required
  type: enum ['daily','project'], required
  project: ObjectId(Project)   # required if type === 'project'
  workCompleted: String
  currentWork: String
  blockers: String
  nextPriorities: String
  date: Date, default now
}
```

## Attachment
```
{
  fileName: String, required
  url: String, required          # S3 key or local path
  uploadedBy: ObjectId(User), required
  relatedType: enum ['project','milestone','task','release']
  relatedId: ObjectId            # polymorphic ref, resolved by relatedType
  uploadDate: Date, default now
}
```

## Indexes to add early
- `User.email` (unique)
- `Task.milestone`, `Task.assignedTo`, `Task.status`
- `TimeLog.task`, `TimeLog.user`, compound `{task, status}` for "current running timer" lookups
- `Project.client`, `Project.status`
- `Invoice.project`
