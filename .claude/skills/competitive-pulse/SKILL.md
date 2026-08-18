---
name: competitive-pulse
description: >
  End-to-end competitive intelligence pipeline for any date range (last week,
  last month, last quarter, last year, or a custom range). Collects signals
  from Aha product activity, competitor/market research (battlecards,
  benchmarks, public competitor moves), and the #Product Slack channel;
  classifies every signal; detects patterns and trends; challenges
  assumptions Devil's-Advocate style; proposes prioritized opportunities; and
  packages the supporting evidence. Use when: competitive pulse, competitive
  intelligence report, monthly competitive analysis, quarterly competitive
  review, competitor pulse check, market intelligence digest.
---

# Competitive Pulse

Runs the full competitive intelligence pipeline for a date range you choose: **collect → classify → detect patterns → challenge assumptions → propose opportunities → prepare evidence.**

## Invocation
`/competitive-pulse <range>` where `<range>` is one of `last week`, `last month`, `last quarter`, `last year`, or an explicit `YYYY-MM-DD..YYYY-MM-DD`. If no range is given, ask which one before starting — don't default silently, since it changes what counts as "recent."

## Output
Save to `strategy/outputs/competitive-pulse-[range-slug]-[YYYY-MM-DD].md`

## When to Use This Skill
- Recurring competitive/market intelligence check-ins (weekly input to stand-up, monthly business review, quarterly planning, annual retro)
- Grounding roadmap prioritization in fresh evidence instead of stale assumptions
- Answering "what's changed in the market" with a defensible, sourced answer

## What You'll Need
- Aha MCP access (idea/epic/feature/note records)
- Slack MCP access, and the #Product channel
- Klue MCP access for battlecards/cards, if your org uses Klue — otherwise web research (WebSearch/WebFetch) fills the same role
- The date range for this run

## Process

### Step 0 — Resolve the date range
Run `date` to get today's date, then convert the requested range into concrete start/end dates:
- `last week` → today − 7 days → today
- `last month` → today − 30 days → today
- `last quarter` → today − 90 days → today
- `last year` → today − 365 days → today
- Custom → use the given dates verbatim

State the resolved window back to the user before collecting anything (e.g., "Running competitive pulse for 2026-05-18 → 2026-08-18").

### Step 1 — Collect
Pull raw signal from three sources, all scoped to the resolved window. If a source or tool isn't available, say so explicitly and continue with what you have — don't silently skip it.

**A. Aha — internal product signal**
Reuse the `aha-monthly-report` methodology, scoped to the resolved window instead of a fixed 30 days:
- `search_records` for ideas/epics/features/notes touched in the window
- `read_records` in small batches (10–15 ids) for `created_at`, `workflow_status`, votes, comments
- Capture: new work created, engagement spikes, momentum shifts

**B. Competitor/market research — external signal**
- If you have a `context/competitors.md` file, read it first and use it as the tracked-competitor list
- If Klue is connected: `extract_battlecards` / `extract_cards` per tracked competitor, filtered to updates in the window
- Otherwise (or in addition): WebSearch/WebFetch each competitor's changelog, pricing page, and release notes for the window — product launches, pricing/packaging changes, positioning shifts, funding/M&A news
- Produce a benchmark table: competitor × dimension (features shipped, pricing moves, messaging changes, publicly-mentioned wins/losses)

**C. Slack #Product channel — internal-team signal**
- `slack_search_channels` to resolve the #Product channel
- `slack_read_channel` (or date-bounded `slack_search_public`/`slack_search_public_and_private` queries) scoped to the window
- `slack_read_thread` on messages that mention competitors, customer churn/win/loss, or market shifts
- Capture: direct competitor mentions, customer feedback relayed by CS/Sales, internal debate about market moves

Keep every captured item as a discrete record: `{date, source, raw_text/quote, link/permalink, people_involved}`. This raw list is the evidence backbone for Step 6 — don't discard it once summarized.

### Step 2 — Classify
Tag each collected item into exactly one category:
- **Competitor Move** — a specific action by a named competitor
- **Market Trend** — a broader shift not tied to one competitor
- **Customer Signal** — feedback, churn/win/loss reason, feature request
- **Internal Product Signal** — Aha activity, momentum, engagement
- **Pricing/Packaging** — anything pricing-related, ours or theirs
- **Noise** — mentioned but not substantive enough to act on (log it, exclude from patterns)

### Step 3 — Detect patterns
Across the classified (non-noise) items:
- Cluster by theme/competitor and count frequency within the window
- If an earlier `competitive-pulse-*.md` exists in `strategy/outputs/`, diff against it to show trend direction
- Call out: recurring themes across ≥2 sources (highest confidence), spikes/anomalies, and anything trending toward zero
- Every pattern must cite which specific items support it — no pattern without evidence

### Step 4 — Challenge assumptions (Devil's Advocate)
Before a pattern becomes a recommendation, stress-test it:
- What's the strongest counter-argument to this pattern being real or important?
- Is this 1–2 loud voices in Slack, or a genuinely broad signal? Distinguish anecdote from trend.
- What would have to be true for this pattern to be wrong or temporary?
- What evidence is missing that would change the conclusion?
- Flag confirmation bias — are we seeing this because we expected to?

If the `devils-advocate` skill is available in this session, invoke it against each surviving pattern for a sharper adversarial pass; otherwise apply the checklist above directly. Mark each pattern **Survived challenge** or **Weak — needs more evidence**. Only survivors move to Step 5.

### Step 5 — Propose opportunities
For each pattern that survived Step 4, write an opportunity:
- **Opportunity statement** — what to do, in one sentence
- **Why now** — what changed in this window that makes it timely
- **Evidence strength** — Strong (multiple independent sources) / Moderate / Weak
- **Effort/impact** — a rough call, not a full estimate
- **Suggested next step** — e.g., "run `/jtbd-extractor` on the underlying customer signal," "add to `competitors.md`," "flag for roadmap review"

Rank opportunities by evidence strength × impact, highest first.

### Step 6 — Prepare evidence
Compile an evidence appendix mapping every claim made in Steps 3–5 back to its raw source:
- Direct quotes with Slack permalinks
- Aha record IDs
- Competitor research links/dates
- A confidence label per claim (Strong/Moderate/Weak), consistent with Step 5

Nothing in the main report should lack a traceable line in this appendix — if it can't be cited, don't claim it.

## Output Template

```markdown
# Competitive Pulse — [range label] ([start date] → [end date])

**Generated:** [today's date]

## Summary
[3-5 sentences: what moved, the top opportunity, what still needs evidence]

## Sources Collected
| Source | Items Collected | Notes |
|---|---|---|
| Aha | N | [gaps/limitations] |
| Competitor research | N | [Klue / web, gaps] |
| Slack #Product | N | [gaps] |

## Classified Signals
| Item | Category | Source | Date |
|---|---|---|---|
| [short desc] | Competitor Move | Slack | [date] |

## Patterns Detected
### Pattern 1: [Name]
- **Description:** ...
- **Supporting items:** [N items across M sources]
- **Trend vs. prior window:** [Up/Down/New/Stable]

## Assumptions Challenged
### Pattern 1
- **Counter-argument:** ...
- **Missing evidence:** ...
- **Verdict:** Survived challenge / Weak — needs more evidence

## Proposed Opportunities
### 1. [Opportunity] — Evidence: Strong
- **Why now:** ...
- **Suggested next step:** ...

## Evidence Appendix
| Claim | Source | Link/Ref | Confidence |
|---|---|---|---|
| ... | Slack | [permalink] | Strong |

## Suggested Follow-ups
- [ ] Update `competitors.md` with new intel
- [ ] Run `/jtbd-extractor` on [specific customer signal]
- [ ] Revisit in [next window]
```

## Tips for Best Results
1. **Keep `competitors.md` current** — it seeds Step 1B and lets Step 3 diff against history
2. **Don't skip Step 4** — a pattern from 3 Slack messages by the same person is not a trend
3. **Re-run on a consistent cadence** — week-over-week and quarter-over-quarter comparisons only mean something if the windows are consistent
4. **Evidence first, opinions second** — every opportunity in Step 5 must trace to Step 6
