---
name: clearco-prd-writer
description: "Write a Product Requirements Document (PRD) in ClearCompany's standard format. Use this skill whenever the user asks to write a PRD, create product requirements, document a feature spec, or says things like 'write a PRD for X', 'create requirements for X', 'document this feature', 'turn this into a PRD', 'I need a PRD', or pastes a feature idea and asks to write it up. Also trigger when the user provides a prototype, wireframe description, or feature brief and wants it turned into formal requirements. The skill produces a fully structured document with Problem Statement, Product Solution, Goals & Success Metrics, Non-Goals, and a Requirements section organized by feature area/module using a 3-column table (Feature Name | User Story | Acceptance Criteria) where acceptance criteria follow Gherkin scenario format (Given/When/Then/And)."
---

# ClearCompany PRD Writer

You are writing a Product Requirements Document (PRD) in ClearCompany's standard format. This format is designed to align engineering, design, and stakeholders around what is being built and why — before a single line of code is written.

## Document structure

Produce the PRD with these five sections in order:

---

### 1. Problem Statement

Describe the pain point from the affected user's perspective (recruiter, candidate, HR admin, etc.). Be specific about:
- **Who** is affected
- **What** they cannot do today (or do poorly/inefficiently)
- **What the consequence is** — slower hiring, missed candidates, compliance risk, poor experience

Keep this section solution-free. A reader should feel the pain and understand why it matters without knowing the answer yet.

---

### 2. Product Solution

Describe what is being built at a high level. If the feature has multiple modules, components, or surfaces, list them numbered (e.g., "The feature is organized into four modules: 1. Zero-Touch Funnel, 2. Prioritization…"). Mention the integration or system involved where relevant. Keep it to 1–3 short paragraphs — this is a summary, not a spec.

---

### 3. Goals & Success Metrics

A bullet list combining:
- **Outcome goals**: what the feature should achieve for the user/business (e.g., "Reduce recruiter time on initial screening")
- **Success metrics**: how you'll know it worked, with targets where known (e.g., "≥70% of invited candidates complete screening within 72 hours")

If a metric isn't defined yet, write: *"[Metric TBD — to be confirmed with data team]"* so the gap is visible rather than hidden.

---

### 4. Non-Goals

A bullet list of what is explicitly **out of scope** for this release. This section is as important as the Goals section — it prevents scope creep and misaligned expectations.

Think about:
- Adjacent features being deferred
- Future-phase enhancements ("V2", "Phase 2")
- Edge cases or integrations not included
- Things someone might assume are included but aren't

If something is "out now but planned later", say so explicitly (e.g., "Bulk re-invite — deferred to V2").

---

### 5. Requirements

Organize requirements into sections matching the **tabs, modules, or feature areas** of the product being specified. Use H3 headings for each section (e.g., `### Module 1 — Zero-Touch Funnel`).

Within each section, use a **3-column Markdown table**:

| Feature Name | User Story | Acceptance Criteria |
|---|---|---|

**Column 1 — Feature Name**
Short, descriptive name in **bold**. Name it after the capability, not the UI element (e.g., "Recruiter Trigger Configuration", not "Toggle").

**Column 2 — User Story**
Written as: *As a [role], I want to [action] so I can [outcome].*

The role should match who primarily uses this feature (recruiter, candidate, HR admin, system admin). Use the candidate's perspective for candidate-facing surfaces.

**Column 3 — Acceptance Criteria**
One or more Gherkin scenarios. Format each as:

```
**Scenario N: Descriptive title**
- Given [precondition or starting state]
- When [action taken]
- Then [expected outcome]
- And [additional outcome] (if needed)
```

## How to write great acceptance criteria

**Cover all meaningful states.** For every feature, ask: What does success look like? What happens when it fails or errors? What are the guard/disabled conditions? Are there bulk vs. individual variants?

**Be specific, not vague.** "The system handles it correctly" is not an acceptance criterion. Name the exact UI element, status badge, toast message, or timeline event. If you know the copy from a prototype, use it (e.g., `"Trigger settings saved · applies to future candidates"`).

**Each scenario is self-contained.** A QA engineer should be able to read any single scenario without needing to read the others.

**Recruiter + candidate surfaces**: ClearCompany features often have both sides. Write separate Feature Name rows for each perspective rather than cramming both into one row.

**Compliance callouts**: If a feature has legal/regulatory implications (AI, data privacy, EEO, NYC Local Law 144, IL AI Video Interview Act), add a Scenario that explicitly flags it as requiring legal review before GTM. Don't silently omit compliance concerns.

**Typical scenario count per feature**: 3–6 scenarios is normal. Simple toggles might need 2; complex flows with multiple modes and error states might need 8+.

## Example of a well-written requirements row

| **Recruiter Trigger Configuration** | As a recruiter, I want to configure how AI Screening is triggered per requisition so I can control when candidates are screened based on the hiring need and role volume. | **Scenario 1: See configuration** <br> - Given the customer has AI Screener enabled <br> - When the recruiter reaches the job posting options page <br> - Then the recruiter sees an "AI Screening" toggle within the AI-Powered Recruiting section <br> - When the toggle is enabled <br> - Then a "AI Screening Trigger" section appears with three options: (1) During candidate application, (2) Triggered per stage, (3) Manual <br><br> **Scenario 2: Save settings** <br> - Given the recruiter has selected a trigger option <br> - When they click "Save trigger settings" <br> - Then a confirmation toast shows: "Trigger settings saved · applies to future candidates" <br> - And the configuration applies only to future candidates, not retroactively |

## When input is a prototype or wireframe

When given a prototype (HTML file, wireframe description, or annotated screenshots), extract the PRD content as follows:
- **Tabs / modules** → use as Requirement section headings
- **Design notes and rationale** → inform Problem Statement and Product Solution
- **Interactive states** (error, loading, disabled, empty, success) → each becomes a Gherkin scenario
- **Inline help text or toast copy** → use verbatim in acceptance criteria
- **Compliance/legal callouts** in design notes → preserve as a Scenario with a note to confirm with Legal before GTM

## Output format

Deliver as clean Markdown unless the user asks for a different format. Use `##` for the five main section headings and `###` for module names within Requirements. Tables use standard Markdown pipe syntax. After delivering the PRD, offer to push it to Confluence or convert it to a Word document if the user mentions needing to share it.
