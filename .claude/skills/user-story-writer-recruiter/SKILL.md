---
name: user-story-writer-recruiter
description: Write well-structured Jira tickets from the recruiter perspective, following a strict format of Title + User Story + Acceptance Criteria with Gherkin-style scenarios. Use this skill whenever a Product Manager asks to write, draft, create, or generate a Jira ticket, user story, or acceptance criteria for recruiter-facing features — such as job configuration, sourcing tools, pipeline management, reporting, or ATS settings. Trigger even if the user just describes a feature and says "write this up" or "turn this into a ticket".
---

# User Story Writer — Recruiter

Writes Jira tickets for recruiter-facing features from the **recruiter's perspective**. Output is always: **Title → User Story → Acceptance Criteria**.

---

## Output Format

### Title
A short, descriptive title scoped to the feature and the recruiter experience.
Format: `[Feature Area] – [What the recruiter can do]`
Example: `Career Site Widget – Configure Location Search Dimensions`

---

### User Story
Always written from the **recruiter's perspective** using this exact structure:

```
As a [recruiter persona + context],
I want to [goal/action],
so that [benefit/outcome].
```

**Rules:**
- The subject is always a recruiter (e.g., "a recruiter configuring the Career Site Widget", "a hiring manager reviewing applications", "a recruiter admin managing job postings")
- The "want" is a specific, observable action the recruiter takes in the system
- The "so that" is a concrete benefit to the recruiter or the hiring process — not a technical goal
- One sentence, no line breaks mid-clause

---

### Acceptance Criteria
Each AC item covers one distinct behavior, configuration state, or edge case. Write **as many scenarios as needed** to fully cover the feature — don't truncate for brevity.

Structure each AC item as:

```
N. [Criterion Name in Title Case]

Scenario: [Scenario name describing the specific state]

* Given [precondition / system state]
* When [recruiter action or trigger]
* Then [expected result visible to the recruiter]
* And [additional observable result, if needed]

Scenario: [Another scenario if this criterion has multiple paths]

* Given ...
* When ...
* Then ...
```

**Rules:**
- Number each top-level criterion (1, 2, 3…)
- Criterion names are noun phrases, not verbs (e.g., "Save and Publish Configuration", not "Check that configuration saves")
- Scenarios use plain past/present tense — no technical jargon unless unavoidable
- Every Given/When/Then line starts with `*`
- `And` continues a Then; don't start a new Then for the same outcome
- Cover the **happy path first**, then edge cases, then error/empty states
- Never skip the "nothing configured yet", "partial setup", or "permission denied" scenario if the feature has those states
- AC is from the recruiter's observable experience in the admin UI — not internal system behavior
- **Always include a dedicated "Error States" criterion** — see the Error Coverage section below

---

## Step-by-Step Process

1. **Read the feature description** the PM provides. Identify:
   - Which recruiter persona is relevant (sourcer, recruiter, hiring manager, admin)
   - What the recruiter is trying to configure, manage, or view
   - What permission levels or roles affect the experience
   - What system states or configurations apply (draft vs published, enabled vs disabled)
   - What edge cases, error conditions, and empty states apply

2. **Draft the Title** — keep it short and scannable.

3. **Write the User Story** — one clear sentence, strict As/I want/So that format.

4. **Map all scenarios** before writing AC — use the checklist below:
   - Happy path (feature works as intended)
   - Partial / incomplete configuration (saved but not published, some fields missing)
   - Empty / first-time setup state (no data yet, fresh account)
   - Permission and role boundaries (admin vs standard recruiter vs read-only)
   - Boundary inputs (too long, special characters, duplicate names)
   - Network / API failure visible to the recruiter
   - Unsaved changes warning (navigating away mid-edit)
   - Concurrent editing conflicts (another user changed the same record)
   - Bulk actions (select all, partial selection, confirmation dialogs)
   - Any limits hit (max jobs, max users, max file size)

5. **Write AC** — one criterion block per behavior area. Put the **Error States criterion last**, after all functional criteria. Never omit it.

6. **Review**: Does every scenario answer "what does the recruiter see or experience in the UI?" Error messages must describe what the recruiter reads, not what the system logs.

---

## Examples

### Example: Configure Location Search Dimensions

**Title:** Career Site Widget – Configure Location Search Dimensions

**User Story:**
As a recruiter configuring the Career Site Widget, I want to enable or disable City, State, and Country as searchable location dimensions, so that candidates only see the location filters relevant to how my organization structures its job postings.

**Acceptance Criteria**

1. Enable and Disable Location Dimensions

Scenario: Recruiter enables all dimensions

* Given the recruiter is on the Location Search configuration screen
* When they toggle on Address, City, State, and Country
* Then all four dimensions are marked as enabled
* And a confirmation message reads "Location search settings saved."

Scenario: Recruiter disables a previously enabled dimension

* Given City is currently enabled
* When the recruiter toggles City off and saves
* Then City is marked as disabled
* And City no longer appears in the candidate-facing location dropdown

Scenario: Recruiter saves with no dimensions enabled

* Given all dimensions are currently toggled off
* When the recruiter saves the configuration
* Then the settings are saved
* And a warning reads "No location dimensions are enabled. Candidates will not see location search options."

2. Unsaved Changes Behavior

Scenario: Recruiter navigates away with unsaved changes

* Given the recruiter has toggled a dimension but not yet saved
* When they attempt to navigate to another page
* Then a dialog appears reading "You have unsaved changes. Leave anyway?"
* And the recruiter can choose to stay and save, or leave and discard changes

3. Error States

Scenario: Save fails due to network error

* Given the recruiter has made changes to location dimensions
* When the save request fails due to a network error
* Then an inline error reads "Changes couldn't be saved. Please try again."
* And the recruiter's unsaved changes remain visible so they can retry

Scenario: Configuration page fails to load

* Given the recruiter navigates to the Location Search configuration screen
* When the page fails to load due to a server error
* Then a message reads "Unable to load configuration. Please refresh the page."
* And a "Refresh" button is displayed

---

## Error Coverage (Required)

Every ticket **must** include an **Error States** criterion (always the last numbered criterion). Use the categories below as a checklist — include every one that applies to the feature.

### Error Categories to Consider

**1. Network & API Failures**
- Save/publish action fails because the server is unreachable
- Page or data fails to load (what does the recruiter see while waiting? what if it never loads?)
- Partial data returned (some records load, others don't)

**2. Invalid or Unexpected Input**
- Recruiter enters a value in the wrong format (e.g., letters in a numeric field)
- Input exceeds character limits
- Duplicate name or record already exists
- Required field left blank on submission

**3. Empty / First-Time State**
- No jobs, candidates, or records exist yet — recruiter needs a clear prompt, not a blank screen
- Feature is enabled but nothing has been configured yet

**4. Permission & Role Boundaries**
- Recruiter with insufficient permissions attempts a restricted action
- Read-only user attempts to edit — what do they see?
- Admin-only feature accessed by a standard recruiter

**5. Unsaved Changes & Navigation**
- Recruiter navigates away mid-edit — is there a warning?
- Browser refresh loses draft state — is there auto-save or a recovery prompt?

**6. Concurrent Editing Conflicts**
- Two recruiters edit the same record simultaneously
- A record was deleted by another user while the recruiter had it open

**7. Limits & Quotas**
- Recruiter hits a maximum (e.g., max active job postings, max team members, max file size)
- Recruiter tries to create a duplicate record

**8. Retry & Recovery**
- After a failed save, can the recruiter retry without losing their input?
- Is there a fallback or draft state?

### Error Message Rules
When writing error scenarios, always specify:
- **What the recruiter sees** — the message text or UI state (e.g., "an inline error reads 'Job title is required.'")
- **Where it appears** — inline below the field, toast notification, modal, banner
- **Whether input is preserved** — recruiter's data should not be wiped on error
- **What action is available** — retry button, fix-and-resubmit, contact support

### Error Scenario Template

```
Scenario: [Short name for the error condition]

* Given [the precondition that sets up the failure]
* When [the action that triggers it]
* Then [the recruiter-visible error message or UI state]
* And [what the recruiter can do next — retry, correct input, contact support]
```

---

## Tips for Edge Case Coverage

Always ask yourself:
- What if **nothing is configured yet**? (first-time / empty state)
- What if **only part of the setup is complete**? (draft, partial config)
- What if the recruiter **has the wrong permissions**? (role boundary)
- What if the recruiter **makes an input error** — wrong format, too long, duplicate?
- What if the feature **partially loads** or data is unavailable?
- What if the recruiter **hits a limit** — max jobs, max users, max file size?
- What if the recruiter **navigates away mid-edit**? (unsaved changes)
- What if **two recruiters edit the same thing** at the same time? (conflict)
- What happens **after an error** — can the recruiter recover without starting over?

Each of these that applies to the feature should have its own scenario in the Error States criterion.
