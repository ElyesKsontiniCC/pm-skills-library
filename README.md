# PM Skills Library

A shared library of Claude Code skills for Product Managers at ClearCompany. Covers the full PM workflow — from requirements writing to discovery research to monthly reporting.

---

## Installation

Copy all skills to your global Claude Code directory:

```bash
cp -r .claude/skills/* ~/.claude/skills/
```

Then restart Claude Code. Skills will appear in `/` autocomplete.

---

## First-time setup (required for domain-specific skills)

Three skills in this library are templates that need to be personalized for your product domain:

- `user-story-writer` — writes Jira tickets for your personas
- `requirements-stress-review` — audits requirements with your domain's entity context  
- `aha-monthly-report` — monthly Aha report using your tags

Run this once after installing:

```
/pm-setup
```

Claude will ask you five questions (about 3 minutes), then generate three domain-specific skills saved to `~/.claude/skills/`. Example output for a Performance Management PM:

```
~/.claude/skills/user-story-writer-performance-management/
~/.claude/skills/requirements-stress-review-performance-management/
~/.claude/skills/aha-monthly-report-performance-management/
```

---

## Skill Catalog

### Execution Skills

| Skill | What it does | Domain-specific? |
|---|---|---|
| `/user-story-writer-candidate` | Writes Jira tickets from the candidate perspective — Title + User Story + Gherkin ACs | Template (run `/pm-setup`) |
| `/user-story-writer-recruiter` | Same, from the recruiter/admin perspective | Template (run `/pm-setup`) |
| `/requirements-stress-review` | Aggressive engineer's-eye gap & blocker report on any user story, ticket, or PRD. Produces a rewritten story with tightened ACs. | Template (run `/pm-setup`) |
| `/clearco-prd-brainstorm` | Shapes an open question *before* the PRD — resurfaces prior decisions, generates distinct approaches, grounds them in the ClearCo codebase and web research, and records the pick with its runner-up and reversal condition | Ready to use |
| `/clearco-prd-writer` | Full PRD generation following ClearCompany's format | Ready to use |
| `/ux-design-story-writer` | Writes design-focused user stories with UX-specific acceptance criteria | Ready to use |

### Discovery Skills

| Skill | What it does | Domain-specific? |
|---|---|---|
| `/aha-monthly-report` | Monthly product workspace activity report from Aha — engagement signals, new work, momentum | Template (run `/pm-setup`) |
| `/journey-map-creator` | Generates end-to-end journey maps for a given persona and workflow | Ready to use |
| `/jtbd-extractor` | Extracts Jobs-to-Be-Done from research, interviews, or feature descriptions | Ready to use |
| `/landscape-mapper` | Competitive landscape analysis and positioning map | Ready to use |

---

## PRD decision index

`/clearco-prd-brainstorm` reads and writes an append-only record of product decisions at:

```
~/Documents/PM AI Agents/prd-decisions/<product-area>/<prd-slug>.md
```

Each decision carries four required parts — the decision, **why**, the **runner-up**, and
**what would flip it**. The reversal condition is the one people skip and the one that matters
most: a decision recorded without it quietly outlives its reasons, and nobody can tell later
whether it still holds.

Step 0 of the skill searches this corpus before generating any options, so a new PRD surfaces
what was already decided in its area instead of silently contradicting it. The corpus starts
empty and compounds — it is worth more with every PRD you run through the skill.

Validate records with:

```bash
node ~/.claude/skills/clearco-prd-brainstorm/scripts/prd-decisions-index.mjs --check
```

Search them with `--query "<text>"`. Retrieval is **literal phrase matching** — try several
phrasings, and read a zero-match result as "nothing matched my words", never as "nothing was
decided here". Override the corpus location with `PRD_DECISIONS_DIR`.

---

## How domain personalization works

When you run `/pm-setup`, Claude interviews you:

1. **Domain slug** — e.g., `performance-management` (used to name your skills)
2. **Personas / ICP** — who uses your product (become the "As a..." in user stories)
3. **Feature areas** — what you own (gives requirements reviewer domain context)
4. **Aha tags** — how your team tags ideas/epics/features in Aha
5. **Email + Aha prefix** — for the monthly report

Claude then reads the three template skills and generates new versions with your context baked in. The methodology (entity lifecycle audit, Gherkin structure, error coverage framework) is preserved — only the domain references change.

---

## Contributing

To add a new skill:

1. Create `.claude/skills/{skill-name}/SKILL.md`
2. Follow the frontmatter format:
   ```yaml
   ---
   name: skill-name
   description: >
     One-paragraph description. Include trigger phrases so Claude
     knows when to invoke this skill automatically.
   ---
   ```
3. Open a PR — ping the Candidate Experience PM team for review

---

## Questions

Reach out to the Candidate Experience team or open an issue in this repo.
