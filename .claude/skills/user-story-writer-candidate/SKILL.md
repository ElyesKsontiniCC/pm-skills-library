---
name: user-story-writer-candidate
description: Write well-structured Jira tickets from the candidate perspective, following a strict format of Title + User Story + Acceptance Criteria with Gherkin-style scenarios. Use this skill whenever a Product Manager asks to write, draft, create, or generate a Jira ticket, user story, or acceptance criteria — especially for recruiting, career site, or candidate-facing features. Trigger even if the user just describes a feature and says "write this up" or "turn this into a ticket".
---

# User Story Writer — Candidate

Writes Jira tickets for candidate-facing features from the **candidate's perspective**. Output is always: **Title → User Story → Acceptance Criteria**.

---

## Output Format

### Title
A short, descriptive title scoped to the feature and the candidate experience.
Format: `[Feature Area] – [What the candidate can do]`
Example: `Career Site Widget – Location Search by City, State, and Country`

---

### User Story
Always written from the **candidate's perspective** using this exact structure:

```
As a [candidate persona + context],
I want to [goal/action],
so that [benefit/outcome].
```

**Rules:**
- The subject is always a candidate (e.g., "a candidate using the Career Site Widget", "a job seeker on the application page")
- The "want" is a specific, observable action the candidate takes
- The "so that" is a concrete benefit to the candidate — not a business goal
- One sentence, no line breaks mid-clause

---

### Acceptance Criteria
Each AC item covers one distinct behavior, edge case, or configuration state. Write **as many scenarios as needed** to fully cover the feature — don't truncate for brevity.

Structure each AC item as:

```
N. [Criterion Name in Title Case]

Scenario: [Scenario name describing the specific state]

* Given [precondition / system state]
* When [candidate action or trigger]
* Then [expected result visible to the candidate]
* And [additional observable result, if needed]

Scenario: [Another scenario if this criterion has multiple paths]

* Given ...
* When ...
* Then ...
```

**Rules:**
- Number each top-level criterion (1, 2, 3…)
- Criterion names are noun phrases, not verbs (e.g., "Render Configured Dimensions", not "Check that dimensions render")
- Scenarios use plain past/present tense — no technical jargon unless unavoidable
- Every Given/When/Then line starts with `*`
- `And` continues a Then; don't start a new Then for the same outcome
- Cover the **happy path first**, then edge cases, then error/empty states
- Never skip the "disabled/empty/none configured" scenario if the feature has a configurable or optional state
- AC is from the candidate's observable experience — not internal system behavior
- **Always include a dedicated "Error States" criterion** — see the Error Coverage section below

---

## Step-by-Step Process

1. **Read the feature description** the PM provides. Identify:
   - Who the candidate is in this context (general job seeker, returning applicant, etc.)
   - What the candidate wants to accomplish
   - What system states or configurations affect the experience
   - What edge cases, error conditions, and empty states apply

2. **Draft the Title** — keep it short and scannable.

3. **Write the User Story** — one clear sentence, strict As/I want/So that format.

4. **Map all scenarios** before writing AC — use the checklist below:
   - Happy path (feature works as intended)
   - Partial / subset configuration
   - Empty / nothing configured state
   - Boundary inputs (too long, special characters, numbers where text expected)
   - Network / API failure visible to the candidate
   - Timeout or slow load
   - Invalid or malformed input by the candidate
   - Session expiry / authentication loss mid-flow
   - Retry behavior after an error
   - Any limits hit (max items, max characters, quota exceeded)

5. **Write AC** — one criterion block per behavior area. Put the **Error States criterion last**, after all functional criteria. Never omit it.

6. **Review**: Does every scenario answer "what does the candidate see or experience?" If any line describes internal system logic with no candidate-visible outcome, rewrite it. Error messages must be described from what the candidate reads, not what the system logs.

---

## Examples

### Example: Location Search Configuration

**Title:** Career Site Widget – Location Search by City, State, and Country

**User Story:**
As a candidate using the Career Site Widget, I want to see City, State, and Country options in the location search dropdown when they are enabled by the recruiter, so that I can search for jobs by the location dimensions that the organization has configured.

**Acceptance Criteria**

1. Render Configured Dimensions

Scenario: All dimensions enabled

* Given the recruiter has enabled search by Address, City, State, and Country
* When the candidate opens the location dropdown
* Then City, State, and Country options (and Address input) should be displayed and selectable

Scenario: Subset of dimensions enabled

* Given the recruiter has enabled only some of the dimensions
* When the candidate opens the location dropdown
* Then only the enabled dimensions should be displayed
* And the disabled ones should be hidden

Scenario: No dimensions enabled

* Given the recruiter has not enabled any location dimensions
* When the candidate opens the location dropdown
* Then no location filter options are shown
* And the candidate sees a message indicating location search is unavailable

2. Search Behavior by Dimension

Scenario: Candidate searches by City

* Given City is enabled and the candidate types a city name
* When the candidate selects a city from the suggestions
* Then job results are filtered to show only jobs in that city

Scenario: Candidate searches by Country only

* Given only Country is enabled
* When the candidate selects a country
* Then job results are filtered to that country with no city or state refinement available

---

## Error Coverage (Required)

Every ticket **must** include an **Error States** criterion (always the last numbered criterion). Use the categories below as a checklist — include every one that applies to the feature.

### Error Categories to Consider

**1. Network & API Failures**
- Feature fails to load because the server is unreachable
- Data fetch times out (what does the candidate see while waiting? what if it never loads?)
- Partial data returned (some items load, others don't)

**2. Invalid or Unexpected Input**
- Candidate enters text in a numeric field
- Candidate enters a string that is too long (exceeds character limit)
- Candidate uses special characters or emoji where not supported
- Candidate submits an empty required field

**3. No Results / Empty State**
- Search returns zero results — candidate needs a clear message, not a blank page
- A list or feed is empty on first load
- Filters are too restrictive and eliminate all results

**4. Authentication & Session**
- Candidate's session expires mid-flow — what happens to their progress?
- Candidate loses connection and reconnects — is state preserved?
- Candidate tries to access a gated feature without being logged in

**5. Limits & Quotas**
- Candidate hits a maximum (e.g., max saved jobs, max file size for resume upload)
- Candidate tries to submit a duplicate (already applied, already saved)

**6. Retry & Recovery**
- After an error, can the candidate retry without losing their input?
- Is there a fallback state (cached data, offline mode)?

### Error Message Rules
When writing error scenarios, always specify:
- **What the candidate sees** — the message text or UI state (e.g., "an inline error message reads 'Please enter a valid email address'")
- **Where it appears** — inline below the field, toast notification, modal, full-page error
- **Whether input is preserved** — candidate's data should not be wiped on error
- **What action is available** — retry button, redirect, dismiss

### Error Scenario Template

```
Scenario: [Short name for the error condition]

* Given [the precondition that sets up the failure]
* When [the action that triggers it]
* Then [the candidate-visible error message or UI state]
* And [what the candidate can do next — retry, correct input, contact support]
```

### Example Error Criterion

N. Error States

Scenario: Job search fails due to network error

* Given the candidate has entered a search query
* When the results fail to load due to a network error
* Then an inline message reads "Something went wrong. Please try again."
* And a "Retry" button is displayed so the candidate can re-submit without re-entering their query

Scenario: Search returns no results

* Given the candidate has applied filters that match no available jobs
* When the results load
* Then a message reads "No jobs found matching your search. Try adjusting your filters."
* And the candidate's filter selections remain visible so they can modify them

Scenario: Resume upload exceeds file size limit

* Given the candidate is uploading a resume
* When the selected file exceeds the maximum allowed size
* Then an inline error reads "File size exceeds the 5MB limit. Please upload a smaller file."
* And the upload field is cleared so the candidate can select a different file

---

## Tips for Edge Case Coverage

Always ask yourself:
- What if **nothing is configured**? (empty state)
- What if **only the minimum is configured**?
- What if the candidate **takes no action** (default/idle state)?
- What if the candidate **makes an error** — wrong format, too long, too short, special characters?
- What if the feature **partially loads** or data is unavailable?
- What if the candidate **hits a limit** — max items, max file size, max attempts?
- What if the candidate **loses their session** mid-flow?
- What happens **after an error** — can the candidate recover without starting over?

Each of these that applies to the feature should have its own scenario in the Error States criterion.
