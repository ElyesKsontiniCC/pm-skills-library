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
| `/clearco-prd-writer` | Full PRD generation following ClearCompany's format | Ready to use |
| `/ux-design-story-writer` | Writes design-focused user stories with UX-specific acceptance criteria | Ready to use |

### Discovery Skills

| Skill | What it does | Domain-specific? |
|---|---|---|
| `/aha-monthly-report` | Monthly product workspace activity report from Aha — engagement signals, new work, momentum | Template (run `/pm-setup`) |
| `/journey-map-creator` | Generates end-to-end journey maps for a given persona and workflow | Ready to use |
| `/jtbd-extractor` | Extracts Jobs-to-Be-Done from research, interviews, or feature descriptions | Ready to use |
| `/landscape-mapper` | Competitive landscape analysis and positioning map | Ready to use |
| `/competitive-pulse` | Runs collect → classify → detect patterns → challenge assumptions → propose opportunities → prepare evidence across Aha, competitor/market research, and #Product Slack for a date range you choose (last week/month/quarter/year, or custom) | Ready to use |

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
