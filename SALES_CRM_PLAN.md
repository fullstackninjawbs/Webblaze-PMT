# Sales CRM & KPI System — Implementation Plan

Source: `Upwork-Sales-CRM-KPI-System` Google Sheet (78 columns, one row per
job proposal). This plan maps every column group in the sheet to a data
model, a scoring/automation engine, and a set of screens inside the PMT
tool — this becomes a new top-level module, not a bolt-on to Projects.

## 1. What This Sheet Actually Is

It's not a simple lead list — it's a **proposal pipeline with two built-in
scoring rubrics and a fully automated stage/KPI layer**:

1. **Job Discovery** — a job is found on Upwork and logged with its raw
   attributes (budget, client history, competition level)
2. **Job Quality Score (JQS)** — 8 sub-scores rate whether this job is even
   worth bidding on, averaged into one number, feeding a Qualified/Not
   Qualified gate
3. **Proposal Authoring** — details of the proposal written (template,
   personalization, case study used, connects spent)
4. **Proposal Quality Score (PQS)** — 6 sub-scores rate the proposal itself
   after the fact, averaged into one number
5. **Pipeline Tracking** — a sequence of boolean/date checkpoints (Sent →
   Viewed → Replied → Interview → Offer → Hired/Lost) that a set of
   **auto-computed fields** derive a single "Current Stage" from
6. **Follow-up Cadence** — up to 3 follow-ups tracked, with an auto count of
   required vs. completed
7. **Auto KPIs** — response time, sales cycle length, week/month rollups,
   repeat-client detection — all computed, never manually entered

Every "(auto)" column in the sheet must be a **server-computed field**, not
a form input — that's the single most important modeling decision here.

## 2. New Roles

The sheet implies at least one role not yet in the system:
- **`sales_exec`** — creates/owns proposals, sees only their own pipeline
- **`sales_manager`** (optional, recommend adding) — sees all executives'
  pipelines, KPI dashboard, revenue reports — maps to how Admin/PM oversee
  the project side today

Add these to the existing `role` enum on `User` alongside
`admin/pm/team_lead/team_member` rather than overloading PM for this — the
data and permissions are genuinely different (Upwork proposals vs. internal
project delivery).

## 3. Data Model — `Proposal`

Grouped by the sheet's own column clusters (col letters from the sheet
noted for traceability):

### Identity & Discovery (A–T)
```ts
{
  proposalCode: String, unique         // A: Proposal ID, e.g. P-0001, auto-generated sequential
  dateFound: Date                      // B
  dateApplied: Date                    // C
  salesExec: ObjectId(User)            // E
  upworkProfile: String                // F — which agency/freelancer profile bid
  jobTitle: String                     // G
  jobUrl: String                       // H
  clientName: String                   // I
  clientCountry: String                // J
  clientIndustry: String               // K
  serviceCategory: String              // L
  jobType: enum ['fixed_price','hourly']  // M
  jobBudget: Number                    // N — null for hourly
  estimatedProjectValue: Number        // O
  jobPostedAgeHrs: Number              // P
  clientHiringHistory: Number          // Q — # prior hires
  clientSpendOnUpwork: Number          // R
  paymentVerified: Boolean             // S
  proposalCompetitionCount: Number     // T — # of competing proposals
  clientActivityLevel: enum ['very_active','moderate','low']  // U
}
```

### Job Quality Score — JQS (V–AF)
```ts
jqs: {
  skillFit: Number,          // 1-10, V
  budgetFit: Number,         // W
  clientQuality: Number,     // X
  jobClarity: Number,        // Y
  portfolioFit: Number,      // Z
  hiringProbability: Number, // AA
  competitionScore: Number,  // AB (10 = low competition)
  timingScore: Number,       // AC (10 = fresh job)
  historicalActivity: Number // AD
},
jobQualityScore: Number,     // AE — AUTO: average of the 8 jqs sub-scores
qualified: Boolean           // AF — AUTO or manual override: true if jobQualityScore >= threshold (default 7, configurable)
```

### Proposal Authoring & PQS (AG–AT)
```ts
proposalWriter: ObjectId(User),        // AG
proposalTemplate: String,              // AH — e.g. "Template B – Case-study led"
openingHookUsed: Boolean,              // AI
personalizationLevel: enum ['low','medium','high'],  // AJ
relevantCaseStudyUsed: Boolean,        // AK
portfolioLinkUsed: Boolean,            // AL
proposalLengthWords: Number,           // AM
ctaUsed: Boolean,                      // AN
pqs: {
  jobFit: Number, personalization: Number, relevantProof: Number,     // AO-AQ
  solutionClarity: Number, ctaStrength: Number, painPointAlignment: Number  // AR-AT
},
proposalQualityScore: Number           // AT+1 — AUTO: average of the 6 pqs sub-scores
```

### Connects / Spend (AU–AZ)
```ts
connectsUsed: Number,          // AU
boostConnects: Number,         // AV
totalConnects: Number,         // AW — AUTO: connectsUsed + boostConnects
connectCost: Number,           // AX
boostedVsOrganic: enum ['boosted','organic']  // AY
```

### Pipeline Checkpoints (AZ–BM)
```ts
proposalSent: Boolean, proposalViewed: Boolean, viewDate: Date,
clientReplied: Boolean, replyDate: Date,
interviewScheduled: Boolean, interviewDate: Date,
followUp1Done: Boolean, followUp2Done: Boolean, followUp3Done: Boolean,
offerReceived: Boolean,
hired: Boolean, lost: Boolean,
noResponse: Boolean,           // AUTO: derived, see §4
lostReason: String
```

### Auto-Computed Rollups (BN–CB)
```ts
currentStage: enum [              // AUTO — see state machine in §4
  'applied','sent','viewed','replied','interview',
  'offer','won','lost','no_response'
],
nextFollowUpDate: Date,           // manual, PM/exec sets this
nextAction: String,               // manual free text
notes: String,                    // manual free text
wonRevenue: Number,               // manual, entered on Won
daysToFirstResponse: Number,      // AUTO: replyDate - dateApplied
salesCycleDays: Number,           // AUTO: dateClosed - dateApplied
followUpsRequired: Number,        // AUTO: based on stage/time elapsed rules
followUpsCompleted: Number,       // AUTO: count of followUp1/2/3Done === true
weekStarting: Date,               // AUTO: start of week containing dateApplied
month: String,                    // AUTO: derived from dateApplied
dayApplied: String,               // AUTO: weekday name from dateApplied
repeatClient: Boolean,            // AUTO: clientName seen in a prior WON proposal
dateClosed: Date                  // AUTO: set when hired or lost flips true
}
```

## 4. Automation Logic (the part with actual business rules)

This is the core engineering work — implement as service-layer functions
that run on every save, not as frontend display tricks:

**Score averages:**
```ts
jobQualityScore = average(Object.values(jqs))     // rounded to 1 decimal
proposalQualityScore = average(Object.values(pqs))
```

**Current Stage state machine** (evaluate in this priority order — first
match wins):
```
hired === true                          → 'won'
lost === true                           → 'lost'
offerReceived === true                  → 'offer'
interviewScheduled === true             → 'interview'
clientReplied === true                  → 'replied'
proposalViewed === true                 → 'viewed'
proposalSent === true                   → 'sent'
else                                    → 'applied'

Additionally, no_response = true when:
  proposalSent === true AND clientReplied === false
  AND (today - dateApplied) > configurable threshold (e.g. 14 days)
  AND hired/lost both false
  → currentStage overridden to 'no_response' in that case
```

**Follow-ups required** — business rule to confirm with the sales team, but
a reasonable default derived from the sheet's data (3 follow-up slots
exist):
```
if no response within 3 days of send   → 1 follow-up required
if no response within 7 days           → 2 required
if no response within 14 days          → 3 required
followUpsCompleted = count of true among followUp1Done/2Done/3Done
```

**Repeat client:**
```
repeatClient = exists(Proposal.find({ clientName, hired: true, _id: { $ne: this._id } }))
```

**dateClosed:** set automatically the moment `hired` or `lost` transitions
to `true` — never manually editable, since `salesCycleDays` depends on it
being accurate.

All of the above run in a `proposal.service.ts` `computeDerivedFields()`
function called on every create/update, before save — never trust a client
to send these values, and never store them as independently-editable form
fields.

## 5. Integration With Existing PMT Modules

This is the highest-value addition beyond a 1:1 sheet port: when a proposal
is marked **Hired**, offer a one-click action:
```
"Convert to Client & Project"
  → pre-fills Client creation form (clientName, country → matches
    existing Client model fields)
  → pre-fills Project creation form (name from jobTitle, totalBudget from
    estimatedProjectValue or wonRevenue, billingType from jobType)
  → links Proposal.convertedProjectId back to the new Project for traceability
```
This closes the loop between "how we won the work" and "how we deliver
it" inside one tool, instead of the sales sheet and the delivery system
living in separate places forever.

## 6. RBAC

| Resource | Admin | Sales Manager | Sales Exec | PM/TL/Team Member |
|---|---|---|---|---|
| All proposals | F | F | ✗ | ✗ |
| Own proposals | F | F | F (create/edit own) | ✗ |
| KPI Dashboard | F | F | R (own stats only) | ✗ |
| Convert to Client/Project | F | F | ✗ (needs Admin/PM approval step) | — |
| Connect cost / revenue figures | F | F | R (own only) | ✗ |

Same principle as the rest of the app: scope-filter at the query layer for
`sales_exec`, never rely on the frontend to hide other executives' pipelines.

## 7. Screens

| Screen | Purpose |
|---|---|
| **Proposal List** (paginated, per `PAGINATION_PLAN.md`) | Filterable by stage, sales exec, date range, qualified/not — this is the main working view |
| **Proposal Detail / Edit** | Tabbed form: Job Info · JQS Scoring · Proposal Info · PQS Scoring · Pipeline & Follow-ups · Notes — mirrors the sheet's column grouping so the sales team's mental model transfers directly |
| **Kanban / Pipeline Board** | Columns = currentStage values, cards = proposals, drag-to-update the underlying boolean flags (optional but high-value — this is how most CRMs present pipeline) |
| **Sales KPI Dashboard** | Win rate, avg JQS/PQS (won vs. lost), avg sales cycle days, revenue by exec, repeat-client %, connects cost per hire — see §8 |
| **Follow-up Queue** | Cross-executive (manager view) or own (exec view) list of proposals with `nextFollowUpDate` due today/overdue |

## 8. KPI Dashboard — Specific Metrics

Derived entirely from fields already in §3–4, no new data needed:
- **Win rate** = won / (won + lost) over a date range
- **Avg JQS of won vs. lost** — validates whether the qualification scoring
  is actually predictive
- **Avg sales cycle days** by service category / client country
- **Revenue by sales executive**, by month (uses `wonRevenue` +
  `weekStarting`/`month` auto fields — no extra aggregation logic needed
  beyond a `$group`)
- **Connects cost per hire** = total connect cost / hires, by executive
- **Repeat client %** = count(repeatClient === true) / total won
- **Follow-up compliance** = followUpsCompleted / followUpsRequired,
  flags executives falling behind on cadence

## 9. Implementation Phases

1. **Schema + automation engine** (5–6 days) — `Proposal` model, all
   derived-field logic in `proposal.service.ts`, unit tests for every auto
   field (this is where bugs will hide, test the state machine and the
   score averages thoroughly)
2. **Roles + RBAC** (1–2 days) — add `sales_exec`/`sales_manager`, scope
   filters on all proposal queries
3. **Proposal List + Detail/Edit screens** (4–5 days) — tabbed form
   matching the sheet's column groups
4. **Follow-up Queue + Convert-to-Client/Project action** (3–4 days)
5. **KPI Dashboard** (3–4 days) — aggregation endpoints + chart views
6. **Kanban board** (optional, 2–3 days) — nice-to-have, do last

~18–24 days total for a solo build, before your existing testing/hardening
pass.

## Open Questions to Confirm

- **Qualification threshold**: sheet implies a JQS cutoff for
  Qualified/Not Qualified — confirm the number (defaulted to 7 above) and
  whether it should be configurable per service category.
- **Follow-up timing rules**: the 3/7/14-day thresholds above are inferred,
  not stated in the sheet — confirm actual required cadence with the sales
  team before building the automation.
- **Does the sheet have additional tabs** (e.g. a KPI dashboard tab, a
  lost-reasons reference list, an executive roster)? Only one tab (gid
  361200825) was accessible for this plan — if there's a second tab with
  dashboard formulas or reference lists, share that gid so it can be
  folded in, particularly if it defines the KPI chart types expected.
