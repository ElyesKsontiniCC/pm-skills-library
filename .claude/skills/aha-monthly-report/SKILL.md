---
name: aha-monthly-report
description: >
  Template for generating a monthly product workspace activity report from Aha.
  This is a base template — run /pm-setup to generate a domain-specific version
  with your tags, email, and Aha workspace prefix pre-configured.
---

# Aha Monthly Report — Template

> **Note:** This is the base template. Run `/pm-setup` to generate a version
> pre-configured with your domain tags, email address, and Aha workspace prefix.
> Your generated skill will be named `aha-monthly-report-{your-domain}`.

You are generating a monthly product workspace activity report from Aha for **{DOMAIN_NAME}**. You have TWO outputs: (1) a Gmail draft report, and (2) an update to the live PM Operating System artifact's Aha section.

---

## Configuration (fill these in when running `/pm-setup`)

- **Domain name:** `{DOMAIN_NAME}`
- **Report recipient email:** `{YOUR_EMAIL}`
- **Aha workspace prefix:** `{AHA_PREFIX}` (e.g., `APP`, `PM`, `PROD`)
- **Domain tags:** `{AHA_TAGS}`

---

## Step 1 — Fetch data from Aha

Use the Aha MCP tools to search for records matching your domain tags.

Search for all three record types: idea, epic, feature.

Use `search_records` with queries covering your domain tag keywords and related terms.

NOTE: `search_records` returns IDs/names only. To get dates, status, and votes you must then call `read_records` on the relevant IDs. These responses can be very large — request small batches (10–15 IDs) and extract just the fields you need (reference_num, created_at, workflow_status name, votes total_count) rather than re-reading the whole file.

---

## Step 2 — Analyze and structure the report

Focus ONLY on records created or meaningfully updated in the last 30 days (the report month). Filter out noise.

For **ENGAGEMENT**, the score per idea = NEW votes + NEW comments + NEW organizations within the report month. Be exhaustive — missing an active idea is a defect. Method:

- Call `read_records` with `include:["vote","comment","portal_comment"]`, `fields:"minimal"`, `association_fields:"detailed"` in small batches.
- Each idea_endorsement (vote) record has its own `created_at` and an `idea_organization {name}` — count votes with `created_at` in the report month as NEW votes.
- Count comments with `created_at` in the month as NEW comments.
- Count distinct idea_organizations among those month-dated votes/comments as NEW organizations.
- Rank ideas by score = newVotes + newComments + newOrgs (descending; tie-break by total votes), keep the top 10.

**FEATURE FILTER:** When retrieving features, include ONLY features whose `workflow_status` name is exactly "Under consideration" or "Planning". Exclude all other statuses. This filter applies to features only — ideas, epics, and notes are NOT subject to it.

Structure the report with these sections:

1. **New Work Created** — UP TO 10 items: new ideas, epics, and notes created in the month, plus features passing the filter (ID, created date, name, status).
2. **Engagement Signals** — top 10 ideas by engagement score with breakdowns; flag sudden spikes; comment themes.
3. **Momentum & Prioritization Signals** — what's getting attention, what's emerging, what's losing traction.
4. **Key Changes & Activity Summary** — 5–10 bullets of the most important developments.
5. **Insights & Recommendations** — what PMs should watch, what to prioritize next, risks.

Report writing rules: no raw activity dump; signal over noise; group similar items; highlight trends/anomalies; concise and decision-oriented for a Head of Product.

---

## Step 3 — Send via Gmail draft

Use the Gmail MCP tool (`create_draft`):
- To: `{YOUR_EMAIL}`
- Subject: `📊 {DOMAIN_NAME} Product Workspace Activity Report — [Month Year]`
- Body: full HTML-formatted report (tables for structured data, inline styles)
- Footer: "This report is automatically generated monthly by Claude via Aha MCP."

---

## Step 4 — Update the live artifact

Read the current PM Operating System artifact HTML. Locate the `const AHA_REPORT = {...}` block. Replace ONLY that object with the new month's data in this shape:

```
const AHA_REPORT = {
  monthLabel: "<Month Year>",
  lastSynced: "<YYYY-MM-DD>",
  newWork: [ {id, name, type, status, date} ],     // up to 10; type: "Feature"|"Epic"|"Idea"|"Note"
  engagement: [ {id, name, score, newVotes, newComments, newOrgs, totalVotes, note} ],  // top 10
  momentum: [ "...", ... ],      // 2–4 short strings
  keyChanges: [ "...", ... ],    // 4–6 short strings
  insights: [ "...", ... ]       // 3–5 short strings
};
```

Do NOT change any other part of the artifact HTML — preserve everything else byte-for-byte.

---

## Important notes

- Today's date: run `date` via bash. The last 30 days = today minus 30 days to today.
- Be factual — only include records that actually appear in Aha for the window. If a section is empty, use an empty array; never invent records.
- The Aha workspace prefix for your account is `{AHA_PREFIX}` (ideas: `{AHA_PREFIX}-I-XXXX`, epics: `{AHA_PREFIX}-E-XXXX`, features: `{AHA_PREFIX}-XXXX`, notes: `{AHA_PREFIX}-N-XXX`).
