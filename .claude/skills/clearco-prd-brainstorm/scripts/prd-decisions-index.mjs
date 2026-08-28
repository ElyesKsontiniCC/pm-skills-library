#!/usr/bin/env node
/**
 * PRD decision index — every product decision we have recorded, in one searchable place.
 *
 * Ported from clearcompany/employee-events `tools/decisions-index.mjs`. The extraction engine
 * (section finding, block parsing, and the candidate accounting rule below) is UNCHANGED; what was
 * replaced is corpus discovery (a `plans/<slug>/` tree became a PRD decisions directory), the
 * standing model (there is no plan-approval gate here, so nothing is "ratified"), and the CI
 * ratchet (a committed baseline file and a git base-ref comparison, both meaningless outside CI).
 *
 *   node prd-decisions-index.mjs --query <text>   full-text search, generated fresh in memory
 *   node prd-decisions-index.mjs --check          fail on any unparsed section or unaccounted line
 *   node prd-decisions-index.mjs --write          also emit <root>/.index.json for grepping
 *
 * CORPUS. One markdown file per PRD, grouped into a directory per product area:
 *
 *   <root>/<area>/<prd-slug>.md      § /^#{2,3}\s*[\d.]*\s*Decisions\b/i
 *   <root>/<prd-slug>.md             § same (un-areaed records)
 *
 * <root> is $PRD_DECISIONS_DIR, defaulting to ~/Documents/PM AI Agents/prd-decisions.
 * Files and directories starting with `.` or `_` are skipped, as is README.md.
 *
 * THE BINDING RULE THIS TOOL IS BUILT AROUND — never silently narrow the input. Reporting an
 * unparseable *section* is necessary and not sufficient: a section that parses while yielding fewer
 * decisions than it contains loses the remainder with no trace, and "every decision we have
 * recorded" becomes quietly false. So every section is accounted for line by line:
 *
 *   candidates (a deliberately WIDER matcher than the decision matcher)
 *     = matched (a decision opener)
 *     + attributed (a line belonging to an already-matched decision's block)
 *     + unaccounted (reported, never discarded)
 *
 * That arithmetic is asserted, not hoped for: a run that cannot satisfy it throws rather than
 * reporting success. There is no ignore list — an exclusion list is exactly the silent narrowing
 * this rule exists to forbid.
 *
 * A ZERO-MATCH QUERY MEANS NOTHING MATCHED YOUR WORDS, NOT THAT NOTHING WAS EVER DECIDED.
 * Retrieval is literal phrase matching — your words must appear as a contiguous substring in a
 * record's title, why, runner-up, reversal condition, or slug. A prior decision worded differently
 * — even just a different word order — will not be returned, and there is no way to detect that
 * recall miss. The CLI says so on every empty result; do not let a clean search read as a clean area.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { homedir } from 'node:os';

/** Local convenience artifact for grepping. Never committed; fully regenerable via `--write`. */
export const INDEX_PATH = '.index.json';

/**
 * The corpus root. `$PRD_DECISIONS_DIR` overrides the default so the skill can be pointed at a
 * different tree without editing this file.
 */
export function resolveRoot(env = process.env) {
  const override = env.PRD_DECISIONS_DIR;
  if (override && override.trim()) return resolve(override.trim());
  return join(homedir(), 'Documents', 'PM AI Agents', 'prd-decisions');
}

/**
 * The repo's canonical approval marker. ONE regex with ONE home: tools/check-plan-docs.mjs imports
 * this rather than carrying a second copy, because `standing` and the plan-docs approval gate must
 * never be able to disagree about what "approved" means. The capture group is the only addition to
 * the shape check-plan-docs.mjs has always used; matching semantics are unchanged.
 */
export const APPROVED_LINE = /^>\s*Approved:\s*(\d{4}-\d{2}-\d{2})/m;

/** Decisions-section headings, verified against all observed spellings in plans/*'/'brainstorm.md. */
export const DECISIONS_HEADING = /^(#{2,3})\s*[\d.]*\s*Decisions\b/i;
/** Approved plans record their decisions under exactly one heading. */
export const KEY_DECISIONS_HEADING = /^(##)\s*Key decisions\b/i;

/**
 * What this port actually matches: `## Decisions`, `### 5. Decisions`, and `## Key decisions`.
 * Both original spellings are accepted because the cost of rejecting one is a record dropping out
 * of every future search with no trace — the exact silent narrowing this tool exists to forbid.
 */
export const PRD_DECISIONS_HEADING = /^(#{2,3})\s*[\d.]*\s*(?:Key\s+)?Decisions\b/i;

/**
 * CANDIDATE matcher — any line that could open an item, whatever its emphasis shape. This must stay
 * provably WIDER than DECISION_OPENERS below (asserted in the tests): a candidate matcher that is
 * not wider cannot see the shape the decision matcher missed, which is the whole point.
 */
export const CANDIDATE_MATCHERS = [
  /^\s*[-*+]\s+\S/, //      markdown bullet
  /^\s*\d+[.)]\s+\S/, //    enumeration
  /^\s*\*\*/, //            a bold-opening line, which is not a list item at all
  /^#{2,6}\s*\S/, //        a sub-heading used as a decision header (\s* — must stay >= as wide as
  //                        the heading-id decision opener below, which allows zero whitespace)
];

/**
 * DECISION matcher — the four bullet shapes this corpus uses, plus one heading shape.
 *
 * The four bullet shapes are the frozen set (implementation.md § Milestone step 1). `heading-id` is
 * a fifth, added deliberately: the standing decision log
 * (plans/new-hire-preview/decision-log.md) records all 26 of its decisions as `## D<n> — <title>`
 * headings, and AC 5 names that log as one of the four sources whose decisions must be listed.
 * Without it that source contributes nothing at all. It is a heading whose text opens with a
 * D-number, so it cannot collide with a prose heading.
 */
export const DECISION_OPENERS = [
  { shape: 'bold-id', re: /^\s*(?:[-*+]\s+|\d+[.)]\s+)?\*\*\s*D\d+[a-z]?\b/ },
  { shape: 'bold-number', re: /^\s*(?:[-*+]\s+)?\*\*\s*\d+[.)]/ },
  { shape: 'number-bold', re: /^\s*\d+[.)]\s+\*\*/ },
  { shape: 'bullet-bold', re: /^\s*[-*+]\s+\*\*/ },
  { shape: 'heading-id', re: /^#{2,6}\s*D\d+[a-z]?\b/ },
];

/**
 * Labelled field markers. A field is read from an EXPLICIT label only — `flipCondition` and
 * `runnerUp` are null when the source carries no label, never guessed from neighbouring prose
 * (AC 5's "shows blank rather than invented"). `why` has one documented exception, below.
 * `other` labels are not extracted; they exist so a segment boundary is recognised.
 */
const MARKER_LABELS = [
  ['why', String.raw`Why|Rationale`],
  ['runnerUp', String.raw`Runner[-\s]?up`],
  [
    'flipCondition',
    String.raw`What would flip (?:it|this)|What flips (?:it|this)|Flips? if|Flip condition|What would change (?:it|this)|Reversal condition`,
  ],
  ['other', String.raw`Decision|Confidence|Outcome|Evidence|Impact|So what|Note|Trade-?off`],
];

/**
 * `*Label:*`, `**Label:**`, `**Label**:` and bare `Label:` all read the same. A short qualifier
 * between the label and the colon also reads the same — the corpus writes `**Why it wins:**` and
 * `**Why (Jobs lens, grounded):**` as often as a bare `**Why:**`, and without this a real, present
 * reason was silently dropped to `null` (a completeness bug, not a "shows blank" case — the source
 * DOES state a reason; the extractor just missed the label). Bounded to a short parenthetical or a
 * few lowercase words so this can't run on and swallow the whole sentence as part of the label.
 */
function markerRegex(labelSource) {
  return new RegExp(
    String.raw`(?:^|[\s(>·])(?:\*\*|\*|__|_)?\s*(?:${labelSource})(?:\s*\([^)\n]{1,60}\)|\s+[a-z][\w\s,'/-]{0,30})?\s*(?::\s*(?:\*\*|\*|__|_)?|(?:\*\*|\*|__|_)\s*:)\s*`,
    'gi',
  );
}

/**
 * A line that OPENS with one of those labels is a decision's own field, never a new decision.
 * Kept in lockstep with markerRegex's qualifier allowance — "**Why it wins:** …" is a why field,
 * not a fresh candidate line, for the same reason markerRegex needs to recognise it as one.
 */
const MARKER_LINE = new RegExp(
  String.raw`^(?:[-*+]\s+|\d+[.)]\s+)?(?:\*\*|\*|__|_)?\s*(?:${MARKER_LABELS.map(([, source]) => source).join('|')})(?:\s*\([^)\n]{1,60}\)|\s+[a-z][\w\s,'/-]{0,30})?\s*(?::|(?:\*\*|\*|__|_)\s*:)`,
  'i',
);

// ── text helpers ─────────────────────────────────────────────────────────────

/** Blank out HTML comments (keeping line numbers) so template guidance is never a decision. */
export function stripComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
}

/**
 * Lines inside a fenced code block are markdown structure, not content: an example block showing a
 * bullet is not a decision and not a missing one. This is a structural rule about markdown, not an
 * ignore list of particular content.
 */
export function fenceMask(lines) {
  const mask = [];
  let open = null;
  for (const line of lines) {
    const fence = line.match(/^\s*(`{3,}|~{3,})/);
    if (open === null) {
      mask.push(false);
      if (fence) open = fence[1][0];
    } else {
      mask.push(true);
      if (fence && fence[1][0] === open) open = null;
    }
  }
  return mask;
}

function collapse(text) {
  return String(text).replace(/\s+/g, ' ').trim();
}

function tidyValue(text) {
  const value = collapse(text)
    .replace(/^[—–\-:*_\s]+/, '')
    .replace(/[\s*_]+$/, '')
    .trim();
  return value.length > 0 ? value : null;
}

function tidyTitle(text) {
  const value = collapse(text)
    .replace(/^[—–\-:.\s]+/, '')
    .replace(/[\s—–\-:]+$/, '')
    .trim();
  return value.length > 0 ? value : null;
}

function excerpt(line) {
  const value = collapse(line);
  return value.length > 80 ? `${value.slice(0, 77)}...` : value;
}

// ── section discovery ────────────────────────────────────────────────────────

/**
 * Sections whose heading matches `headingRe`, ending at the next heading of the same or higher
 * level. `wholeFile` sources (the standing decision log) are one section covering the file.
 */
export function findSections(text, headingRe, { wholeFile = false } = {}) {
  const lines = stripComments(text).split('\n');
  const fenced = fenceMask(lines);
  if (wholeFile) {
    return [{ heading: null, headingLine: null, start: 0, end: lines.length, lines, fenced }];
  }
  const sections = [];
  for (let i = 0; i < lines.length; i++) {
    if (fenced[i]) continue;
    const match = lines[i].match(headingRe);
    if (!match) continue;
    const level = match[1].length;
    let end = lines.length;
    for (let j = i + 1; j < lines.length; j++) {
      if (fenced[j]) continue;
      const heading = lines[j].match(/^(#{1,6})\s/);
      if (heading && heading[1].length <= level) {
        end = j;
        break;
      }
    }
    sections.push({ heading: lines[i].trim(), headingLine: i + 1, start: i + 1, end, lines, fenced });
  }
  return sections;
}

// ── per-section extraction + the completeness assertion ──────────────────────

function openerShape(line) {
  for (const { shape, re } of DECISION_OPENERS) {
    if (re.test(line)) return shape;
  }
  return null;
}

export function isCandidateLine(line) {
  return CANDIDATE_MATCHERS.some((re) => re.test(line));
}

function fieldsFromBlock(blockText) {
  const markers = [];
  for (const [field, labelSource] of MARKER_LABELS) {
    const re = markerRegex(labelSource);
    for (const match of blockText.matchAll(re)) {
      markers.push({ field, start: match.index, end: match.index + match[0].length });
    }
  }
  markers.sort((a, b) => a.start - b.start);
  // Drop markers that overlap an earlier one (e.g. "Runner-up" inside a longer label match).
  const ordered = [];
  for (const marker of markers) {
    if (ordered.length === 0 || marker.start >= ordered[ordered.length - 1].end) ordered.push(marker);
  }
  const segments = {};
  ordered.forEach((marker, index) => {
    const stop = index + 1 < ordered.length ? ordered[index + 1].start : blockText.length;
    if (segments[marker.field] === undefined) segments[marker.field] = blockText.slice(marker.end, stop);
  });
  const remainder = ordered.length > 0 ? blockText.slice(0, ordered[0].start) : blockText;
  return { segments, remainder, hasMarker: (field) => segments[field] !== undefined };
}

function titleFromBlock(shape, blockText, sequence) {
  if (shape === 'heading-id') {
    const match = blockText.match(/^#{2,6}\s*D(\d+[a-z]?)\b[\s.:—–-]*([^\n]*)/);
    if (match) return { id: `D${match[1]}`, ordinal: Number.parseInt(match[1], 10), title: tidyTitle(match[2]), rest: blockText.slice(match[0].length) };
  }
  if (shape === 'bold-id') {
    const match = blockText.match(/\*\*\s*D(\d+[a-z]?)\b[\s.:—–-]*([\s\S]*?)\*\*/);
    if (match) return { id: `D${match[1]}`, ordinal: Number.parseInt(match[1], 10), title: tidyTitle(match[2]), rest: blockText.slice(match.index + match[0].length) };
  }
  if (shape === 'bold-number') {
    const match = blockText.match(/\*\*\s*(\d+)[.)]\s*([\s\S]*?)\*\*/);
    if (match) return { id: null, ordinal: Number(match[1]), title: tidyTitle(match[2]), rest: blockText.slice(match.index + match[0].length) };
  }
  if (shape === 'number-bold') {
    const match = blockText.match(/^\s*(\d+)[.)]\s+\*\*([\s\S]*?)\*\*/);
    if (match) return { id: null, ordinal: Number(match[1]), title: tidyTitle(match[2]), rest: blockText.slice(match[0].length) };
  }
  if (shape === 'bullet-bold') {
    const match = blockText.match(/^\s*[-*+]\s+\*\*([\s\S]*?)\*\*/);
    if (match) return { id: null, ordinal: sequence, title: tidyTitle(match[1]), rest: blockText.slice(match[0].length) };
  }
  return { id: null, ordinal: sequence, title: tidyTitle(blockText.split('\n')[0]), rest: '' };
}

/**
 * The hard invariant, stated once so it can be tested on its own: every candidate line is either a
 * decision, part of one, or reported. A run that cannot satisfy the arithmetic THROWS rather than
 * reporting success — an extractor that quietly drops what it cannot classify is the substrate that
 * only looks load-bearing.
 */
export function assertAccounting({ candidates, matched, attributed, unaccounted }, where) {
  const total = matched + attributed + unaccounted;
  if (total !== candidates) {
    throw new Error(
      `decisions-index: accounting failed for ${where} — ${candidates} candidate line(s) but ` +
        `matched ${matched} + attributed ${attributed} + unaccounted ${unaccounted} = ${total}`,
    );
  }
}

/**
 * Extract one section's decisions AND account for every candidate line inside it.
 *
 * Returns `{ decisions, unaccounted, counts }` where `counts` proves the arithmetic:
 * `candidates === matched + attributed + unaccounted`.
 */
export function extractSection(section, { sourceFile, occurrence }) {
  const { lines, fenced, start, end } = section;

  // ONE pass classifies every candidate line as matched, attributed, or unaccounted. Doing it in
  // one pass is what makes the attribution rule bind the decision matcher too: a nested `- **…**`
  // sub-bullet under an already-matched decision is part of that decision, so it must not become a
  // decision of its own — otherwise every `*Why:*` sub-bullet in the corpus is indexed as a
  // separate decision and the listing is wrong in the opposite direction.
  const openers = [];
  const unaccounted = [];
  let attributed = 0;
  let candidates = 0;
  for (let i = start; i < end; i++) {
    if (fenced[i]) continue;
    if (!isCandidateLine(lines[i])) continue;
    candidates += 1;
    const parent = openers.length > 0 ? openers[openers.length - 1] : null;
    const indent = lines[i].match(/^\s*/)[0].length;
    const isHeading = /^#{2,6}\s/.test(lines[i]);
    // A heading-opened decision's block runs to the next heading, so containment needs no
    // indentation to be unambiguous.
    const nested = parent !== null && (parent.shape === 'heading-id' ? !isHeading : indent > parent.indent);
    // A `*Why:*` / `*Runner-up:*` / `*What would flip it:*` line belongs to the decision above it
    // whatever its indentation — it is the block's own mandated vocabulary. Without this the
    // warning fills with a decision's own fields and becomes noise nobody reads, which is the same
    // failure by a different route (implementation.md, the completeness assertion, clause 2).
    const ownField = parent !== null && MARKER_LINE.test(lines[i].trim());
    if (nested || ownField) {
      attributed += 1;
      continue;
    }
    const shape = openerShape(lines[i]);
    if (shape) {
      openers.push({ index: i, shape, indent });
      continue;
    }
    unaccounted.push({
      sourceFile,
      line: i + 1,
      sectionHeading: section.heading,
      // The 1-based ordinal of this entry's section among same-named sections in this file, counted
      // across ALL sections regardless of parse outcome (passed in from extractFile). Display-only —
      // kept for humans reading the raw index, not fed into the ratchet's identity (see
      // unaccountedSignature): neither a POSITION (shifts when an unrelated same-named section is
      // inserted/removed elsewhere) nor the section's own mutable body content (shifts on any
      // ordinary, valid edit anywhere else in the SAME section — adding or rewording a sibling
      // decision) is stable enough to identify "which section instance" without false-reding an
      // untouched candidate. `unaccountedSignature` deliberately does not disambiguate same-named
      // sections at all; see that function's docstring for the accepted tradeoff.
      sectionOccurrence: occurrence,
      excerpt: excerpt(lines[i]),
      // Full, untruncated normalized text — this is what the branch-attributable ratchet's identity
      // is keyed on (see unaccountedSignature). `excerpt` stays display-only: two distinct long
      // candidates that happen to share their first 77 characters must not collide into one identity.
      text: collapse(lines[i]),
    });
  }

  const decisions = [];
  const blocks = [];
  openers.forEach((opener, position) => {
    const stop = position + 1 < openers.length ? openers[position + 1].index : end;
    const blockText = lines.slice(opener.index, stop).join('\n');
    const { id, ordinal, title, rest } = titleFromBlock(opener.shape, blockText, position + 1);
    const { segments, remainder, hasMarker } = fieldsFromBlock(rest);
    // `why` is the one field with a fallback, and it is a structural read rather than a guess: the
    // recorded shape is "<decision statement> — <the reasoning>", so when no explicit Why label is
    // present the block's remaining prose IS the reasoning the author wrote. `runnerUp` and
    // `flipCondition` never fall back — AC 5's "shows blank rather than invented" is about those.
    const why = hasMarker('why') ? tidyValue(segments.why) : tidyValue(remainder);
    decisions.push({
      id,
      ordinal,
      title: title ?? excerpt(lines[opener.index]),
      why,
      runnerUp: hasMarker('runnerUp') ? tidyValue(segments.runnerUp) : null,
      flipCondition: hasMarker('flipCondition') ? tidyValue(segments.flipCondition) : null,
      sourceLine: opener.index + 1,
    });
    // The shape check (AC 6) needs to know which fields were carried by an explicit LABEL, which
    // the emitted record cannot say once `why` has fallen back to the block's prose.
    blocks.push({
      line: opener.index + 1,
      shape: opener.shape,
      markers: {
        why: hasMarker('why'),
        runnerUp: hasMarker('runnerUp'),
        flipCondition: hasMarker('flipCondition'),
      },
    });
  });

  assertAccounting(
    { candidates, matched: openers.length, attributed, unaccounted: unaccounted.length },
    `${sourceFile}${section.headingLine ? `:${section.headingLine}` : ''}`,
  );

  return {
    decisions,
    blocks,
    unaccounted,
    counts: { candidates, matched: openers.length, attributed, unaccounted: unaccounted.length },
  };
}

// ── per-file extraction ──────────────────────────────────────────────────────

/**
 * One source in this port, where the original had four: a PRD decision record's `## Decisions`
 * section. `PRD_DECISIONS_HEADING` accepts the "## Key decisions" spelling too, so a record
 * written that way still parses rather than silently dropping out of the corpus.
 */
const SECTION_RULES = {
  prd: { headingRe: PRD_DECISIONS_HEADING, wholeFile: false },
};

/**
 * Extract every decision in one source file, plus its accounting.
 *
 * `unparsedSections` carries both halves of "nothing is skipped": a section the matcher rejected
 * (heading present, zero decisions extracted) AND a file that matched a source pattern but carries
 * no decisions section at all (`heading: null`, `line: 1`). Without the second half a file could
 * drop out of the corpus with no trace, which is the same silent narrowing one level up.
 */
export function extractFile({ sourceFile, text, source, jobSlug }) {
  const rule = SECTION_RULES[source];
  if (!rule) throw new Error(`decisions-index: unknown source "${source}"`);
  const sections = findSections(text, rule.headingRe ?? /^(#)\s/, { wholeFile: rule.wholeFile });
  const decisions = [];
  const blocks = [];
  const unparsedSections = [];
  const unaccounted = [];

  if (sections.length === 0) {
    unparsedSections.push({ sourceFile, line: 1, heading: null, occurrence: 1, content: collapse(text) });
  }
  // Occurrence is counted across EVERY section with this heading text, not only the unparsed ones —
  // it still disambiguates two same-named sections for DISPLAY, but the branch-attributable
  // ratchet's unparsedSectionSignature no longer keys identity on it (see that function): an
  // ordinal is a POSITION, and inserting or deleting an unrelated same-named section elsewhere in
  // the file shifts every later section's ordinal even though its own content never changed, which
  // would either false-red an unmoved section or let a genuinely different section inherit a
  // deleted one's identity. `content` — the section's own normalized body text — moves only when
  // that section's own text changes, so it stays stable under insertion/deletion elsewhere.
  const headingOccurrences = new Map();
  for (const section of sections) {
    const headingKey = section.heading ?? null;
    const occurrence = (headingOccurrences.get(headingKey) ?? 0) + 1;
    headingOccurrences.set(headingKey, occurrence);
    const result = extractSection(section, { sourceFile, occurrence });
    if (result.decisions.length === 0) {
      unparsedSections.push({
        sourceFile,
        line: section.headingLine ?? 1,
        heading: section.heading,
        occurrence,
        content: collapse(section.lines.slice(section.start, section.end).join('\n')),
      });
    }
    for (const decision of result.decisions) {
      decisions.push({ ...decision, source, jobSlug, sourceFile, headingVariant: section.heading });
    }
    blocks.push(...result.blocks.map((block) => ({ ...block, sourceFile, heading: section.heading })));
    unaccounted.push(...result.unaccounted);
  }
  return { decisions, blocks, unparsedSections, unaccounted, sections };
}

// ── standing (AC 7's mark) ───────────────────────────────────────────────────

/**
 * Deterministic, no prose matching.
 *
 * `ratified` iff the record came from a `plan` AND that plan carries the repo's approval line.
 * The `source === "plan"` half is load-bearing: keying on the approval date alone would mark a
 * brainstorm proposal `ratified` merely because its Job's plan was later approved — the opposite of
 * what AC 7 asks for. A record is NEVER marked ratified on the strength of its text.
 *
 * A `proposed` record whose Job's plan IS approved gets a pointer rather than a third label:
 * the standing decisions for that Job live in its approved plan, and whether this proposal was
 * carried through unchanged, refined, or dropped is not machine-derivable.
 */
/**
 * Every recorded PRD decision is `recorded` — full stop.
 *
 * The source tool distinguished `proposed` (a brainstorm decision) from `ratified` (one carried
 * into an approved plan), because that repo has a plan-approval gate to derive it from. This
 * pipeline has no such gate, so inventing a two-tier standing here would be a label with nothing
 * behind it. One honest value beats two decorative ones.
 */
export function deriveStanding() {
  return { standing: 'recorded', supersededByJobPlan: false };
}

// ── corpus discovery ─────────────────────────────────────────────────────────

/**
 * Read a source plan file as UTF-8, with CR stripped.
 *
 * CI regenerates on Linux (LF checkouts); a local `--write` on Windows reads CRLF checkouts. A
 * surviving `\r` inside an extracted field value is escaped by `JSON.stringify` as `\r`, producing
 * different bytes for the same tree on the two platforms. The full index is gitignored now, so
 * this can no longer make `--check`'s (counts-only) gate report stale — but the local `--write`
 * output is still meant to be byte-identical across platforms for anyone diffing it, so it stays
 * normalised to `\n` here.
 */
function readIfPresent(path) {
  if (!existsSync(path)) return null;
  return readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
}

const SKIP_FILE = new Set(['README.md', 'readme.md']);
const hidden = (name) => name.startsWith('.') || name.startsWith('_');

/** A PRD record is any `.md` in the root, or in a one-level-deep area directory. */
function recordFiles(root) {
  if (!existsSync(root)) return [];
  const found = [];
  for (const name of readdirSync(root).sort()) {
    if (hidden(name)) continue;
    const full = join(root, name);
    if (statSync(full).isDirectory()) {
      for (const child of readdirSync(full).sort()) {
        if (hidden(child) || !child.endsWith('.md') || SKIP_FILE.has(child)) continue;
        found.push({ path: join(full, child), slug: `${name}/${child.replace(/\.md$/, '')}`, relative: `${name}/${child}` });
      }
      continue;
    }
    if (!name.endsWith('.md') || SKIP_FILE.has(name)) continue;
    found.push({ path: full, slug: name.replace(/\.md$/, ''), relative: name });
  }
  return found;
}

/**
 * Every PRD decision record, in a stable order. Self-sourced by directory read — there is no
 * second hand-maintained list of PRDs to drift from the tree.
 */
export function collectSources(root) {
  return recordFiles(root).map(({ path, slug, relative }) => ({
    source: 'prd',
    jobSlug: slug,
    sourceFile: relative,
    text: readIfPresent(path),
    planApproved: null,
    standingRecordedIn: null,
  }));
}

// ── index assembly ───────────────────────────────────────────────────────────

/**
 * Deterministic codepoint comparison for the file-path sort key — NOT `localeCompare`.
 *
 * `String.prototype.localeCompare` with no locale uses the ICU collation shipped
 * with the Node build, which differs across Node minor versions and across
 * Windows/Linux builds (node 24.19.0 on Linux orders some ASCII paths differently
 * than node 24.14.1 on Windows). The full index is gitignored now, so this can no
 * longer make the (counts-only) `--check` gate report stale — but a local `--write`
 * on Windows should still produce byte-identical output to CI's Linux run for
 * anyone diffing it, and codepoint comparison (`<` / `>`) is the same on every
 * Node and every platform. The paths here are ASCII repo paths, so collation
 * tailoring buys nothing and costs determinism.
 */
const byCodepoint = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const byFileThenOrdinal = (a, b) =>
  byCodepoint(a.sourceFile, b.sourceFile) || a.ordinal - b.ordinal || a.sourceLine - b.sourceLine;
const byFileThenLine = (a, b) => byCodepoint(a.sourceFile, b.sourceFile) || a.line - b.line;

/** Field order is fixed so the emitted JSON is byte-stable across runs on an unchanged tree. */
function record(decision, file) {
  const { standing, supersededByJobPlan } = deriveStanding({
    source: file.source,
    planApproved: file.planApproved,
  });
  return {
    source: file.source,
    jobSlug: file.jobSlug,
    ordinal: decision.ordinal,
    id: decision.id,
    title: decision.title,
    why: decision.why,
    runnerUp: decision.runnerUp,
    flipCondition: decision.flipCondition,
    sourceFile: decision.sourceFile,
    sourceLine: decision.sourceLine,
    planApproved: file.planApproved,
    standing,
    supersededByJobPlan,
    standingRecordedIn: supersededByJobPlan ? file.standingRecordedIn : null,
    headingVariant: decision.headingVariant,
  };
}

export function buildIndex(files) {
  const decisions = [];
  const unparsedSections = [];
  const unaccounted = [];
  const shapeFindings = [];
  for (const file of files) {
    const extracted = extractFile(file);
    for (const decision of extracted.decisions) decisions.push(record(decision, file));
    unparsedSections.push(...extracted.unparsedSections);
    unaccounted.push(...extracted.unaccounted);
    // A block can parse cleanly while omitting a required field — most easily by splitting a
    // marker like `*What would flip it:*` across a line break, which makes the field read
    // "(not recorded)" in every future search. The accounting above cannot see that (the lines
    // ARE attributed); only the shape check can. This is why it is wired into --check.
    for (const finding of decisionShapeFindings(extracted)) {
      shapeFindings.push({ sourceFile: file.sourceFile, ...finding });
    }
  }
  decisions.sort(byFileThenOrdinal);
  unparsedSections.sort(byFileThenLine);
  unaccounted.sort(byFileThenLine);
  shapeFindings.sort(byFileThenLine);
  return {
    decisions,
    unparsedSections,
    unaccounted,
    shapeFindings,
    counts: {
      files: files.length,
      decisions: decisions.length,
      unparsedSections: unparsedSections.length,
      unaccounted: unaccounted.length,
      shapeFindings: shapeFindings.length,
    },
  };
}

export function serialiseIndex(index) {
  return `${JSON.stringify(index, null, 2)}\n`;
}

export function generate(root) {
  return buildIndex(collectSources(root));
}

// ── query / rendering ────────────────────────────────────────────────────────

export function queryIndex(index, text) {
  const needle = collapse(text).toLowerCase();
  if (!needle) return [];
  return index.decisions.filter((decision) =>
    [decision.title, decision.why, decision.runnerUp, decision.flipCondition, decision.jobSlug]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(needle)),
  );
}

/** One block per match. `(not recorded)` is a visible blank, never an invented value. */
export function renderMatch(decision) {
  const lines = [
    `${decision.standing} · ${decision.jobSlug} ${decision.id ?? `#${decision.ordinal}`} — ${decision.title}`,
    `  from: ${decision.sourceFile}:${decision.sourceLine}`,
    `  why: ${decision.why ?? '(not recorded)'}`,
    `  reversal condition: ${decision.flipCondition ?? '(not recorded)'}`,
  ];
  if (decision.supersededByJobPlan && decision.standingRecordedIn) {
    lines.push(`  standing decisions for this Job: ${decision.standingRecordedIn}`);
  }
  return lines.join('\n');
}

// ── shape enforcement (AC 6) ─────────────────────────────────────────────────

export const DECISION_BLOCK_SHAPE =
  '**D<n> — <title>.** *Why:* … *Runner-up:* … *What would flip it:* …';

/**
 * AC 6's required shape, for PRE-JOB decision records only (brainstorm.md, decision-log.md, and the
 * scratch record). Approved plans' "## Key decisions" sections are deliberately never shape-checked
 * — see implementation.md Risks #4 for the consequence that was accepted eyes-open.
 *
 * Returns findings; the CALLER decides whether they WARN (an inherited record) or FAIL (a record
 * this PR touched). Nothing here rewrites or repairs a record: the fix is always forward.
 */
export function decisionShapeFindings(extracted) {
  const findings = [];
  if (extracted.sections.length === 0) {
    findings.push({
      line: 1,
      message: `no Decisions section — a pre-Job decision record records its decisions as \`${DECISION_BLOCK_SHAPE}\``,
    });
  }
  for (const section of extracted.sections) {
    const inSection = extracted.blocks.filter((block) => block.heading === section.heading);
    if (inSection.length === 0) {
      findings.push({
        line: section.headingLine ?? 1,
        message: `Decisions section yields no decision in the required shape \`${DECISION_BLOCK_SHAPE}\``,
      });
    }
  }
  for (const block of extracted.blocks) {
    const missing = [];
    if (block.shape !== 'bold-id' && block.shape !== 'heading-id') missing.push('the `**D<n> — <title>.**` opening');
    if (!block.markers.why) missing.push('*Why:*');
    if (!block.markers.runnerUp) missing.push('*Runner-up:*');
    if (!block.markers.flipCondition) missing.push('*What would flip it:*');
    if (missing.length > 0) {
      findings.push({
        line: block.line,
        message: `decision block omits ${missing.join(', ')} — required shape: \`${DECISION_BLOCK_SHAPE}\``,
      });
    }
  }
  return findings;
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function warnLines(index) {
  return index.unaccounted.map(
    (entry) => `WARN unaccounted decision candidate ${entry.sourceFile}:${entry.line} — "${entry.excerpt}"`,
  );
}

const USAGE = 'usage: node prd-decisions-index.mjs (--query <text> | --check | --write)';

/**
 * `--check`'s ceiling is ZERO, not a committed baseline.
 *
 * The source tool ratchets against a committed baseline file because its corpus was 45+ inherited
 * records it could not retroactively fix, so the honest gate there was "no worse than before."
 * This corpus starts empty and every record in it is written by this skill in the shape the skill
 * itself specifies — so an unparsed section or an unaccounted line is always a live defect in
 * something just written, never inherited debt. Zero is the correct ceiling, and it needs no file.
 */
export function runCli(argv, { root, log = console.log, error = console.error, generateIndex = generate } = {}) {
  const mode = argv[0];

  if (mode === '--query') {
    const needle = argv.slice(1).join(' ');
    if (!needle) {
      error(USAGE);
      return 2;
    }
    let index;
    try {
      index = generateIndex(root);
    } catch (thrown) {
      error(`FAIL ${thrown.message}`);
      return 1;
    }
    const matches = queryIndex(index, needle);
    if (matches.length === 0) {
      // Say what an empty result actually means. A clean search is not a clean area — the corpus
      // may be empty, or the prior decision may simply be worded differently from the query.
      log(
        index.counts.decisions === 0
          ? `no decisions recorded yet in ${root} — the index is empty, which is not the same as "nothing was decided here".`
          : `no recorded decision matches "${needle}" (searched ${index.counts.decisions} decision(s) by literal phrase — ` +
              `a decision worded differently will not be returned).`,
      );
      return 0;
    }
    for (const match of matches) log(`${renderMatch(match)}\n`);
    log(`${matches.length} of ${index.counts.decisions} recorded decision(s) match "${needle}".`);
    return 0;
  }

  if (mode !== '--write' && mode !== '--check') {
    error(USAGE);
    return 2;
  }

  let index;
  try {
    index = generateIndex(root);
  } catch (thrown) {
    error(`FAIL ${thrown.message}`);
    return 1;
  }

  if (mode === '--write') {
    for (const line of warnLines(index)) log(line);
    const indexPath = join(root, INDEX_PATH);
    mkdirSync(dirname(indexPath), { recursive: true });
    writeFileSync(indexPath, serialiseIndex(index));
    log(`OK wrote ${indexPath} — ${index.counts.decisions} decision(s) from ${index.counts.files} file(s)`);
    return 0;
  }

  let failed = false;
  for (const entry of index.unaccounted) {
    error(`FAIL unaccounted decision candidate ${entry.sourceFile}:${entry.line} — "${entry.excerpt}"`);
    failed = true;
  }
  for (const entry of index.unparsedSections ?? []) {
    error(`FAIL unparsed Decisions section ${entry.sourceFile}:${entry.line ?? '?'}`);
    failed = true;
  }
  for (const entry of index.shapeFindings ?? []) {
    error(`FAIL ${entry.sourceFile}:${entry.line} — ${entry.message}`);
    failed = true;
  }
  if (failed) {
    error(`required shape: ${DECISION_BLOCK_SHAPE}`);
    error('note: a field marker split across a line break does not count — keep each on one line.');
    return 1;
  }
  log(
    `OK ${index.counts.decisions} decision(s) in ${index.counts.files} file(s) — ` +
      'all four required fields present, 0 unparsed section(s), 0 unaccounted candidate(s)',
  );
  return 0;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  process.exit(runCli(process.argv.slice(2), { root: resolveRoot() }));
}
