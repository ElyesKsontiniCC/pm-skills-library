---
name: ux-design-story-writer
description: Write UX design tickets that combine a JTBD-grounded user story, behavior-only requirements, and an inspired design suggestion. Use this skill whenever someone asks to write design tickets, UX user stories, or design requirements for a feature, column, or component. Trigger even if the user says "write this up as a design story", "turn these columns into tickets", or just lists components and says "write requirements". This skill is NOT a generic user story writer — it always attempts a creative design leap beyond the literal request.
---

# UX Design Story Writer

Writes UX design tickets that go beyond feature description to surface the **decision** behind the design. Each ticket combines three things in a specific order:

1. **JTBD-grounded user story** — anchored in what the user is trying to decide, not just what they want to see
2. **Behavior-only requirements** — what the system does, never how it looks
3. **Inspired design suggestion** — a creative leap that serves the underlying decision better than the literal request

Output is always: **Title → User Story → Requirements → Suggested Design**

---

## Inputs to Gather

Before writing, confirm these with the user if not already provided:

- **Feature or epic context** — what are we building? (e.g., "candidate pipeline table", "job posting configuration screen")
- **Persona** — who is using this? (recruiter, hiring manager, admin, sourcer)
- **Constraints** — anything to avoid (e.g., "no filter suggestions", "design hint max 1 line", "don't suggest new data sources")

If the user provides a feature description without a persona, ask before writing. Don't guess the persona — it changes the JTBD entirely.

---

## Output Format

Each feature or component gets its own ticket. Separate multiple tickets with a horizontal rule (`---`).

```
[UX Design] [Feature Area]

User Story
As a [persona] [context],
I want to [job-to-be-done / decision to make],
so that [outcome or action enabled by that decision].

Requirements
1. [Behavioral requirement — what the system does, not how it looks]
2. [Behavioral requirement — optional second, only if distinct from #1]

Suggested Design
[1–2 lines. A creative leap. Name the specific design pattern or interaction.
Ask: what would serve the decision, not just display the data?]
```

### Tag prefix
Default tag is `[UX Design]`. Use whatever prefix the user specifies.

---

## The Three Parts in Detail

### 1. JTBD-Grounded User Story

The story is **not** about seeing or having a feature. It's about the decision or action the feature enables.

**Wrong framing (feature-centric):**
> As a recruiter, I want to see a location column, so that I know where candidates are from.

**Right framing (decision-centric):**
> As a recruiter reviewing a pipeline, I want to know how far each candidate lives from the office, so that I can prioritize who to call first for an in-person interview.

**The test:** Replace "I want to [X]" with "I want to know / decide / judge [X]". If the story still makes sense — you're in JTBD territory. If it sounds awkward — you're still describing a feature.

**Rules:**
- Subject is always the persona in a specific context (not just "a recruiter")
- The "want" expresses a decision, judgment, or prioritization — not a view or display
- The "so that" names the action the decision enables (call them, reject them, advance them, flag them)
- One sentence, no line breaks

---

### 2. Behavior-Only Requirements

Max 2. Each requirement describes **what the system does** in response to data or user action.

**Allowed:**
- "The system displays X when Y"
- "The component updates when Z changes"
- "If no data is available, the field shows [fallback state]"
- "The value is sortable / filterable / clickable"

**Not allowed:**
- Color values, hex codes, font sizes
- Layout or position instructions ("left-aligned", "top of card")
- Wireframe prescriptions ("show an icon next to the text")
- Animation specifics
- Anything that starts with "The design should show..."

If only one requirement is needed, write one. Don't pad.

---

### 3. Inspired Design Suggestion

This is the heart of the skill. **Always attempt a creative leap.**

The prompt to ask yourself before writing this section:
> "What is the [persona] actually trying to **decide** with this information — and what design pattern would serve that decision better than just displaying the raw value?"

The goal is to reframe display → decision support. A location column becomes a distance badge. An application date becomes a freshness signal. A salary number becomes a budget alignment bar. Always ask what the recruiter needs to *do*, then design backwards from that action.

**Format:** 1–2 lines. Name the pattern specifically. Don't say "consider a visual indicator" — say "a distance badge showing miles from office, derived from candidate zip code vs. job location."

---

## Step-by-Step Process

1. **Confirm inputs** — persona, feature context, any constraints.

2. **For each feature, identify the decision** — before writing anything, answer: *What is the persona trying to decide when they look at this?* Write that down internally before writing the user story.

3. **Write the user story** — decision-first, one sentence.

4. **Write 1–2 behavioral requirements** — describe system behavior only. Stop at 2.

5. **Attempt the creative leap** — the suggestion should make a designer think "oh, that's smarter than what we asked for."

---

## Examples

### Example: Candidate Pipeline Table Columns

**Input from PM:**
> Persona: Recruiter reviewing a candidate pipeline
> Feature: Candidate table in ATS — Location, Application Date, Salary Expectation, Skills columns

---

**[UX Design] Candidate Pipeline – Location**

**User Story**
As a recruiter triaging a pipeline for an on-site role, I want to know how far each candidate lives from the job location, so that I can prioritize candidates who are realistically available for in-person interviews.

**Requirements**
1. The system displays the distance between the candidate's location and the job's primary office location.
2. If location data is unavailable for a candidate, the field displays "Location not provided" rather than an empty cell.

**Suggested Design**
A distance badge (e.g., "12 mi" / "3 km") derived from candidate zip code vs. job location — sortable so recruiters can rank by proximity. For remote-eligible roles, the badge adapts to show timezone offset instead.

---

**[UX Design] Candidate Pipeline – Application Date**

**User Story**
As a recruiter managing an active pipeline, I want to know how long ago each candidate applied, so that I can act on the freshest applications before candidate interest cools.

**Requirements**
1. The system displays elapsed time since application (e.g., "2 days ago", "3 weeks ago") rather than a static date.
2. The value updates dynamically and remains accurate without a page refresh.

**Suggested Design**
A freshness indicator — elapsed time label paired with a subtle urgency signal (neutral for <7 days, amber for 7–14 days, muted for 14+ days). Helps recruiters scan for at-risk candidates without opening each record.

---

**[UX Design] Candidate Pipeline – Salary Expectation**

**User Story**
As a recruiter reviewing candidates against a fixed budget, I want to instantly see whether a candidate's salary expectation fits within the role's approved range, so that I can avoid investing time in candidates who are outside budget before the offer stage.

**Requirements**
1. The system compares the candidate's stated salary expectation against the role's configured salary band and surfaces the relationship (within range, above, below).
2. If no salary expectation has been provided by the candidate, the field displays a prompt rather than a blank cell.

**Suggested Design**
A budget alignment bar — a small inline range bar showing where the candidate's number lands relative to the role's min/max band. Scannable across a full pipeline without opening individual profiles.

---

**[UX Design] Candidate Pipeline – Skills**

**User Story**
As a recruiter screening candidates for a technical role, I want to see how a candidate's skills compare to the required skills for the position, so that I can quickly identify strong matches and flag candidates with critical gaps.

**Requirements**
1. The system compares candidate skills against the required and preferred skills defined on the job posting.
2. If no required skills are defined on the job, the column displays the candidate's skills as a plain list with no gap scoring.

**Suggested Design**
A skills gap indicator — required skills shown as filled or hollow chips (matched vs. missing), with preferred skills in a secondary row. Lets a recruiter spot a "3 of 5 required skills" pattern at a glance without opening a resume.
