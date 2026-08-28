---
name: clearco-prd-workflow
description: >
  Create a PRD that aligns with the Candy Team's ways of working. Runs the full 3-step
  ClearCompany PRD pipeline: structure a rough idea into a formal PRD, audit it with an
  engineer's stress-test, then produce a final polished PRD with all gaps closed. Use this
  skill whenever a PM wants to go from a rough idea, feature brief, or draft PRD to a
  complete, battle-tested requirements document in one pass. Trigger on: "run the full PRD
  pipeline", "draft to final PRD", "end-to-end PRD", "PRD pipeline", "structured PRD with
  audit", "go from idea to final requirements", "full requirements workflow", or any time
  someone pastes a feature idea or rough spec and wants a polished final PRD ready for
  engineering. Even if they just say "write a PRD and stress test it" — that's this skill.
---

# ClearCompany PRD Workflow

This skill runs three sequential steps and delivers all three outputs clearly labeled. Do not skip steps or merge them — each output is valuable to the PM.

**Input:** A rough feature idea, draft notes, prototype description, or informal PRD.

**Output:** Three clearly labeled documents — Draft PRD, Audit Report, Final PRD.

---

## STEP 1 — Structured Draft PRD

Write a Product Requirements Document in ClearCompany's standard format. This is a clean, solution-framed document that engineering, design, and stakeholders can align on.

Document sections (in this order):

### 1. Problem Statement

Describe the pain from the affected user's perspective (recruiter, candidate, HR admin, etc.). Be specific about who is affected, what they cannot do today, and what the consequence is (slower hiring, missed candidates, compliance risk). Keep this solution-free — a reader should feel the pain without knowing the answer yet.

### 2. Product Solution

High-level description of what is being built. If the feature has multiple modules or surfaces, list them numbered. Keep it to 1–3 short paragraphs — this is a summary, not a spec.

### 3. Goals & Success Metrics

Bullet list combining outcome goals (what the feature achieves) and success metrics (how you'll know it worked, with targets where known). If a metric isn't defined, write: `[Metric TBD — to be confirmed with data team]` so the gap is visible.

### 4. Non-Goals

Bullet list of what is explicitly out of scope for this release. Include adjacent features being deferred, future-phase enhancements, and things someone might assume are included but aren't. If something is planned for later, say so explicitly (e.g., "Bulk re-invite — deferred to V2").

### 5. Requirements

Organize into sections matching the tabs, modules, or feature areas of the product. Use H3 headings per section. Within each section, use a 3-column Markdown table:

| Feature Name | User Story | Acceptance Criteria |
|---|---|---|

- **Feature Name:** Short, bold, descriptive name for the capability (not the UI element).
- **User Story:** As a [role], I want to [action] so I can [outcome]. Match the role to who primarily uses this feature.
- **Acceptance Criteria:** 3–6 Gherkin scenarios per feature. Cover: happy path, error/validation, empty state, disabled/unauthorized state. Format:

```
**Scenario N: Descriptive title**
- Given [precondition]
- When [action]
- Then [expected outcome]
- And [additional outcome]
```

Use specific UI copy, toast messages, and status labels from the input where available. Write separate rows for recruiter-facing and candidate-facing surfaces. Flag any compliance implications (AI, data privacy, EEO) with a Scenario noting legal review is required before GTM.

Begin Step 1 output with: `## 📋 STEP 1: Structured Draft PRD`

---

## STEP 2 — Requirements Audit

Act as a meticulous senior software engineer who has been burned by vague requirements. Read the Step 1 PRD systematically and surface every missing behavior, undefined state, and unanswered question — before a single line of code is written.

For each gap, label severity:

- 🔴 **Blocker** — Cannot build without a decision. Undefined behavior or state.
- 🟡 **Gap** — Will likely cause a bug or support ticket.
- 🔵 **Edge Case** — Low risk but worth defining; good candidate for "out of scope."

### Audit checklist — apply to every entity and component in the PRD

**Entity Lifecycle** — for every configurable entity (field, value, stage, tag, template, filter, etc.):
- **Creation:** limits? defaults? uniqueness? requires save/publish step?
- **Edit/Rename:** does it cascade to existing records? audit trail?
- **Delete:** hard or soft? what happens to orphaned references? warning before delete? restorable?
- **Reorder:** sort persistence? display order impact on dependent UIs?
- **Disable/Archive:** hidden from new selections but shown on old records? what do candidates/recruiters see?

**Empty States:** What does the UI show when there are no items yet? What does a dependent feature show when its data source is empty?

**Limits & Constraints:** Maximum number of items? Max character lengths? What happens at the limit?

**Concurrency:** What if two admins edit the same config simultaneously? Last-write-wins or locking?

**Permissions:** Who can create/edit/delete? UI difference for unauthorized users (hidden vs. disabled vs. read-only)? Server-side enforcement?

**UI States:** Loading state? Error state with specific copy? Success confirmation? Long name truncation? Mobile/responsive? Accessibility?

**Retroactivity:** Does this affect existing records when enabled? What is the value for records created before this feature? Migration required?

**Integration Impact:** Does this sync to external systems (HRIS, job boards, background check)? Webhooks? API consumers?

**Validation & Errors:** Exact validation rules? Real-time or on-submit? Exact error messages? Duplicate submission?

**Notifications & Side Effects:** Does any action trigger emails, in-app alerts, or audit log entries?

Begin Step 2 output with: `## 🔍 STEP 2: Requirements Audit`

Lead with a 1-sentence summary of what you understood the PRD is doing, then list findings organized by severity (🔴 first), grouped by category. Be direct and specific — say "This is undefined: what happens to X when Y is deleted?" not "you might want to consider."

---

## STEP 3 — Final Polished PRD

Produce a final version of the PRD that incorporates the audit findings. This is the document the PM will share with engineering.

How to synthesize:

1. Go through every 🔴 Blocker and 🟡 Gap from Step 2.
2. For each finding, decide the most reasonable product answer and update the PRD accordingly:
   - Add missing Gherkin scenarios to the relevant Requirements rows.
   - Add items to Non-Goals where behavior is intentionally deferred.
   - Update Problem Statement or Product Solution if a systemic gap reveals a scope issue.
   - Add a new Requirements row if an entire capability was missing.
3. For any 🔴 Blocker that genuinely requires a product decision you cannot make from the input, add it to an **Open Questions** section at the end (don't silently drop it).
4. For 🔵 Edge Cases, use your judgment: close the simple ones in ACs, add the complex ones to Open Questions or Non-Goals.

Output structure for Step 3:

- Begin with: `## ✅ STEP 3: Final Polished PRD`
- Then write a short **Changes Summary** (bullet list) explaining what was added or changed versus the Step 1 draft. This helps the PM understand what the audit caught without re-reading everything.
- Then produce the full Final PRD using the same 5-section structure as Step 1 (Problem Statement, Product Solution, Goals & Success Metrics, Non-Goals, Requirements tables).
- End with an **Open Questions** section if any 🔴 Blockers could not be resolved without a product decision.

---

## Delivery format

Output all three steps in sequence in a single response. Use `---` dividers between steps. The PM should be able to copy Step 3 directly into Confluence or a Word doc. After delivering, offer to push to Confluence or convert to a Word document if the user mentions needing to share it.
