---
name: pm-setup
description: >
  First-time domain personalization for new PMs joining the skills library.
  Interviews you about your product domain, personas, feature areas, Aha tags,
  and email address — then generates three domain-specific skills tailored to
  your context: user-story-writer-{domain}, requirements-stress-review-{domain},
  and aha-monthly-report-{domain}. Run once after installing the library.
  Trigger on: "setup", "personalize my skills", "configure my domain", "onboard",
  or any time a PM says they just installed the library.
---

# PM Skills Library — Domain Setup

Welcome to the PM Skills Library. This setup takes about 3 minutes and generates three skills personalized to your product domain. You will not need to run it again unless your domain changes.

You are the setup guide. Your job is to interview the PM with five questions — one at a time — collect their answers, then generate and write three new skill files to `~/.claude/skills/`.

---

## Phase 1: Interview

Ask these questions one at a time. Wait for a full answer before moving to the next. Do not ask all five at once.

---

**Question 1 — Domain Slug**

Ask:
> "What is your product domain or team name? I'll use this to name your skills. Use a short, lowercase, hyphenated format — no spaces. Examples: `performance-management`, `goals`, `learning-development`, `onboarding`, `compensation`. What's yours?"

Store as `DOMAIN_SLUG`. This becomes the suffix on all three generated skills.

---

**Question 2 — Primary Personas / ICP**

Ask:
> "Who are the primary users (personas) in your domain? For each one, give their name and a one-sentence description of their role and main goal in your product. These become the 'As a...' subjects in your user stories.
>
> Example format:
> - **Performance Admin** — configures review cycles, rating scales, and templates; wants setup to be fast and error-free
> - **Employee** — completes self-assessments and peer reviews; wants a clear, low-friction experience
> - **Manager** — writes manager reviews and calibrates direct reports; needs visibility across their team
>
> List yours:"

Store as `PERSONAS` (a structured list).

---

**Question 3 — Feature Areas You Own**

Ask:
> "List 5–10 product areas or features you own. These give the requirements reviewer domain context for spotting downstream impacts. Examples: `Review Cycles`, `Rating Scales`, `Calibration`, `Goal Setting & Tracking`, `Peer Review`, `1:1 Check-ins`, `Continuous Feedback`. What are yours?"

Store as `FEATURE_AREAS` (a list).

---

**Question 4 — Aha Tags**

Ask:
> "What tags does your team use in Aha to track ideas, epics, and features for your domain? List all you know. Examples: `performance-review`, `goals`, `calibration`, `peer-feedback`, `review-cycle`, `rating-scale`. What are yours?"

Store as `AHA_TAGS` (a list).

---

**Question 5 — Email & Aha Workspace Prefix**

Ask:
> "Two quick config items for the Aha monthly report:
> 1. What email address should the monthly report be sent to?
> 2. What is your Aha workspace prefix? (Check any Aha record ID — it's the letters before the dash. Example: if your records look like `APP-I-1234`, your prefix is `APP`. If you're not sure, type `APP` and you can update it later.)"

Store as `REPORT_EMAIL` and `AHA_PREFIX`.

---

## Phase 2: Generate Three Skills

Once all five answers are collected, confirm with the PM:

> "Got it. Here's what I'll generate:
>
> - `user-story-writer-{DOMAIN_SLUG}` — writes Jira tickets for {persona names}
> - `requirements-stress-review-{DOMAIN_SLUG}` — requirements auditor for {FEATURE_AREAS summary}
> - `aha-monthly-report-{DOMAIN_SLUG}` — monthly Aha report using your {N} tags
>
> Writing to `~/.claude/skills/`... Ready?"

Then proceed to generate and write all three files.

---

### Skill A — `user-story-writer-{DOMAIN_SLUG}`

**Read first:** `~/.claude/skills/user-story-writer-candidate/SKILL.md`

Generate a new version of this skill adapted to the PM's domain. Preserve the entire methodology — output format, AC structure, error coverage framework, step-by-step process. Only change the domain-specific content.

**Adapt these parts:**

1. **Frontmatter**
   - `name`: `user-story-writer-{DOMAIN_SLUG}`
   - `description`: Replace "candidate" with the domain name. List all persona names from `PERSONAS`. Change the trigger conditions to reference `FEATURE_AREAS`.

2. **Header**: Change to `# User Story Writer — {Domain Name (Title Case)}`

3. **Persona handling**: If the PM has multiple personas, add this instruction at the top of the skill body:
   > "When invoked, first ask: 'Which persona are you writing for?' and list the `PERSONAS`. Write the user story from that persona's perspective."

4. **User Story subject line**: Replace `"a candidate using..."` with `"a {persona name} using/configuring/managing..."` (use the right verb for each persona's context).

5. **Title format example**: Use one of the PM's `FEATURE_AREAS` in the example title. Format: `[Feature Area] – [What the {persona} can do]`

6. **Error coverage examples**: Keep all six error categories. Replace any career-site-specific examples (resume upload, career site widget, job search) with equivalent examples from the PM's feature areas.

7. **Tips section**: Keep the "always ask yourself" checklist verbatim — it's universally applicable.

**Write to:** `~/.claude/skills/user-story-writer-{DOMAIN_SLUG}/SKILL.md`

---

### Skill B — `requirements-stress-review-{DOMAIN_SLUG}`

**Read first:** `~/.claude/skills/requirements-stress-review/SKILL.md`

Generate a new version of this skill adapted to the PM's domain. Preserve all ten audit dimensions, the Phase 1 / Phase 2 structure, severity labels, and the rewritten story template. Only change the domain-specific sections.

**Adapt these parts:**

1. **Frontmatter**
   - `name`: `requirements-stress-review-{DOMAIN_SLUG}`
   - `description`: Replace "ATS / HRtech context (ClearCo)" with `{Domain Name} context`. Update trigger conditions to reference the PM's `FEATURE_AREAS`.

2. **Opening line**: Replace "senior software engineer at ClearCo, an ATS / HRtech company" with "senior software engineer working on {Domain Name}".

3. **Common entities list** (the parenthetical after "Common entities in ClearCo context"):
   - Remove the ATS-specific entities.
   - Derive and list entities relevant to the PM's domain from their `FEATURE_AREAS`.
   - For each feature area, think through the entities it creates. Examples:
     - "Review Cycles" → review cycle, review period, review template, review stage, participant list, deadline
     - "Rating Scales" → rating scale, rating tier, rating label, rating weight, numeric range
     - "Goals" → goal, key result, goal cycle, alignment link, check-in, goal status
     - "Peer Review" → peer nomination, peer reviewer, peer review form, review assignment
   - List 10–15 entities derived this way.

4. **ClearCo Context section** (the bottom section):
   - Rename to `## {Domain Name} Context`
   - Replace all bullet points with the PM's `FEATURE_AREAS`.
   - For each feature area, write one line describing what downstream impacts to watch for (follow the same pattern as the original: Feature Name — one-sentence description of what to anticipate).

5. **Everything else** (audit dimensions 1–10, Phase 2 rewrite template, tone rules): preserve verbatim.

**Write to:** `~/.claude/skills/requirements-stress-review-{DOMAIN_SLUG}/SKILL.md`

---

### Skill C — `aha-monthly-report-{DOMAIN_SLUG}`

**Read first:** `~/.claude/skills/aha-monthly-report/SKILL.md`

Generate a new version fully configured for the PM's domain. The report logic, structure, and output format remain identical. Only change the domain-specific configuration.

**Adapt these parts:**

1. **Frontmatter**
   - `name`: `aha-monthly-report-{DOMAIN_SLUG}`
   - `description`: Replace "Template" with the PM's domain name. Remove the "run /pm-setup" note — this IS the generated version.

2. **Opening line**: Replace `{DOMAIN_NAME}` with the PM's actual domain name.

3. **Step 1 — Tags**: Replace all placeholder tags with the PM's `AHA_TAGS`. Generate search queries by:
   - Taking each tag, splitting hyphenated tags into words
   - Grouping related tags into 2–3 search query strings
   - Following the same format as the original (explicit query strings in quotes)

4. **Step 3 — Email**: Replace `{YOUR_EMAIL}` with `REPORT_EMAIL`. Replace `{DOMAIN_NAME}` in the subject with the actual domain name.

5. **Step 4 — Artifact**: Replace `{AHA_PREFIX}` with the PM's `AHA_PREFIX` in all record ID examples.

6. **Important notes**: Replace all `{AHA_PREFIX}` and `{DOMAIN_NAME}` placeholders.

7. **Remove** the "Configuration (fill these in)" section — it's been filled in.

**Write to:** `~/.claude/skills/aha-monthly-report-{DOMAIN_SLUG}/SKILL.md`

---

## Phase 3: Confirm

After writing all three files, display:

```
✅ Setup complete. Three domain-specific skills generated:

  ~/.claude/skills/user-story-writer-{DOMAIN_SLUG}/SKILL.md
  ~/.claude/skills/requirements-stress-review-{DOMAIN_SLUG}/SKILL.md
  ~/.claude/skills/aha-monthly-report-{DOMAIN_SLUG}/SKILL.md

To use them:
  /user-story-writer-{DOMAIN_SLUG}       — write Jira tickets for {persona names}
  /requirements-stress-review-{DOMAIN_SLUG}  — stress-test requirements
  /aha-monthly-report-{DOMAIN_SLUG}       — run your monthly Aha report

You may need to restart Claude Code for new skills to appear in autocomplete.
The five generic skills (clearco-prd-writer, ux-design-story-writer, journey-map-creator,
jtbd-extractor, landscape-mapper) are already active — no setup needed for those.
```

---

## Generation guidelines

- **Preserve methodology.** The value of these skills is in their depth — the entity lifecycle audit, the error coverage framework, the Gherkin AC structure. Do not simplify or shorten them.
- **Infer entities from features.** When deriving the entity list for the requirements reviewer, think through every configurable object in each feature area. Err on the side of listing more entities, not fewer.
- **Make examples feel native.** Replace ClearCo/candidate examples with examples that use the PM's actual feature names and persona names. A skill that still says "career site widget" for a Performance PM is a bad skill.
- **One file per skill.** Write each skill to its own directory under `~/.claude/skills/`. Do not combine them.
- **Verify writes.** After writing each file, confirm it exists before proceeding to the next.
