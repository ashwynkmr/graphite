# Graphite — Technical Requirements (TRD)

Oct 31, 2026 · @Ashwyn · v1.0

> Living document. Technical changes are recorded in the [decision log](../decisions/README.md); this file is updated to match. The build order actually followed is in [ROADMAP](ROADMAP.md) (see decision [0014](../decisions/0014-quant-drill-before-handwritten-problems.md)).

Companion to the Graphite PRD. Covers how Phase 1 is built, with notes where Phase 2 needs room.

## Summary

Graphite is a static, offline-first web app (PWA) built with Vite, React and TypeScript. It is served from GitHub Pages at `ashwynkmr.github.io/graphite`, and all user data lives in each browser's IndexedDB. There is no server, no login and no running cost.

**Key decisions**

- **Static site only.** Content ships as JSON files bundled with the app. All logic (scoring, scheduling, generation) runs in the browser.
- **Content is generated at build time, not typed by hand.** About 80 TypeScript question templates produce the 1,500-question bank with seeded randomness and stable IDs. The same templates run live in the app when the bank runs out.
- **Vocab content is authored in batches** (Claude writes, scripts validate) into `words.json`. A schema check runs on every commit.
- **One storage layer.** Dexie (a thin IndexedDB wrapper) holds sessions, attempts, word states, the mistake log and settings, with a single JSON export and import.
- **Autosave after every answer.** Timers are based on timestamps, so a session survives reloads, app switches and phone locks.
- **Hash-based routing** (`/graphite/#/quant`) so refreshing any screen works on GitHub Pages without a server.
- **CI gates every deploy:** typecheck, unit tests, content validation, then build and publish via GitHub Actions.

## Architecture

&#91;embedded content: architecture · build time and device\]

GitHub stores, checks and serves static files. Everything else, including progress, happens in the browser, and data leaves the device only through Share or Export.

## Tech stack

Every choice is free, well documented and small enough to keep the app under 3 MB.

| Layer | Choice | Why |
| --- | --- | --- |
| Language | TypeScript (strict) | Catches content and logic errors before they ship |
| Build | Vite 5 | Fast builds; simple `base: '/graphite/'` for GitHub Pages |
| UI | React 18 | Familiar, large ecosystem, fine for a small app |
| Routing | React Router (HashRouter) | Refresh-safe on GitHub Pages with no server rewrites |
| State | Zustand | Tiny store for the live session and settings |
| Storage | Dexie 4 on IndexedDB | Indexed queries for stats; handles schema versions |
| Styling | CSS Modules + CSS custom properties | Full control over the minimal look; tokens power light and dark themes |
| Fonts | Self-hosted via Fontsource: Newsreader (serif) and Inter (sans, tabular numbers) | Works offline; no Google Fonts call |
| PWA | vite-plugin-pwa (Workbox) | Precaching, update flow and manifest in one plugin |
| Validation | Zod | One schema used by the content scripts, the app and import |
| Exact math | Own small rational-number helper (BigInt numerator/denominator) | Exact answer comparison; no floating-point surprises |
| Share images | Canvas 2D API, drawn by hand | No extra library; crisp, predictable cards |
| Charts (Phase 2) | Hand-rolled SVG | Two or three simple charts don't justify a library |
| Tests | Vitest + Testing Library; Playwright for 3 smoke flows | Fast unit tests; one real-browser check before deploy |
| CI/CD | GitHub Actions + `actions/deploy-pages` | Free for public repos |

## Repo structure

One public repo, `graphite`. App code, content, content tools and docs live side by side so a content fix and a code fix go through the same pipeline.

```
graphite/
  CLAUDE.md                 # build rules for Claude Code (see Build plan)
  docs/                     # PRD and TRD exports
  content/
    words.json              # 1,500 words (authored, validated)
    questions.json          # 1,500-question bank (generated + hand-written)
    handwritten.json        # ~300 hand-written word problems (source)
    sources/wordlists/      # raw public lists used for ranking
  tools/
    vocab/rank-words.ts     # merge lists -> ranked top 1,500 with tiers
    vocab/validate-words.ts
    quant/build-bank.ts     # run templates -> questions.json
    quant/validate-bank.ts
  src/
    app/                    # routes, layout, tab bar
    features/
      home/  quant/  vocab/  mistakes/  progress/  settings/  share/
    engine/
      generators/           # one file per topic: percents.ts, ratios.ts, ...
      matching/             # rational.ts, numeric-answer.ts, word-answer.ts
      scheduling/           # leitner.ts, rounds.ts
      sessions/             # quant-builder.ts, vocab-builder.ts, session-machine.ts
      stats/                # aggregates for results and progress
    data/
      db.ts                 # Dexie schema + migrations
      repo/                 # read/write helpers per table
      export-import.ts
    content/                # typed loaders for the JSON files
    ui/                     # Keypad, ChoiceList, Flashcard, Timer, Card, Button
    styles/tokens.css
  public/                   # icons, manifest images
  tests/                    # unit + Playwright smoke
  .github/
    workflows/deploy.yml
    ISSUE_TEMPLATE/content-problem.yml
```

## Content schemas

Both content files are arrays of records with stable string IDs. Zod schemas in `src/content/schema.ts` are the single source of truth; the TypeScript types are inferred from them.

**Question (`questions.json`)**

```ts
type Topic = 'arithmetic' | 'fractions' | 'percents' | 'ratios' | 'averages'
           | 'rates' | 'money' | 'exponents' | 'estimation';

interface Question {
  id: string;              // 'pct-change-m-0042' = template + difficulty + index
  topic: Topic;
  difficulty: 1 | 2 | 3;   // easy, medium, hard
  kind: 'calc' | 'word';   // pure calculation or short word problem
  prompt: string;          // plain text; may include × ÷ √
  answer: string;          // canonical exact value: '45', '3/8', '-2.5'
  format: 'number' | 'fraction'; // how the answer and choices are written (added in build step 3)
  rounding?: 'whole' | 'tenth' | 'hundredth';
  unit?: { prefix?: string; suffix?: string };   // '$', '%', 'mph'
  choices?: string[];      // exactly 5 incl. answer; present if MCQ-capable
  mcqOnly?: boolean;       // estimation questions
  targetSec: number;       // expected solve time
  explain: string;         // one-line shortcut
  source: { type: 'template'; templateId: string; seed: number }
        | { type: 'handwritten'; calc: string };   // calc re-checked by the evaluator
}
```

**Word (`words.json`)**

```ts
interface Word {
  id: string;              // the lowercase headword: 'laconic'
  word: string;
  pos: 'noun' | 'verb' | 'adjective' | 'adverb';
  meaning: string;         // one plain-English line, max 90 chars
  example: string;         // one sentence containing the word (or an inflection)
  exampleForm: string;     // the exact form used in the example: 'laconically'
  synonyms: string[];      // 2-3
  variants?: string[];     // accepted spellings: ['judgement']
  mnemonic?: string;       // Phase 2, hardest ~200 words
  tier: 1 | 2 | 3;
  rank: number;            // 1-1500, frequency across lists
  confusables?: string[];  // word ids used as MCQ distractors
}
```

Every question with `choices` can be served as either typed or MCQ; questions without `choices` are typed only. The build script fills `choices` for at least 70% of questions so Mix mode has enough MCQs per topic.

## Question generator

Each template is a pure function from a seeded random source to a question. Code computes the answer, so answers can't be wrong unless the template is.

```ts
interface Template {
  id: string;                       // 'pct-change'
  topic: Topic;
  kind: 'calc' | 'word';
  difficulties: (1 | 2 | 3)[];
  generate(rng: Rng, d: 1 | 2 | 3): Draft | null;   // null = reject this draw
}
interface Draft {
  prompt: string; answer: Rational; rounding?: Rounding; unit?: Unit;
  distractors: Rational[];          // from the mistake rules below
  targetSec: number; explain: string; mcqOnly?: boolean;
}
```

**Rules every template follows**

- **Seeded randomness:** `Rng` is mulberry32 seeded by an integer, so the same seed always gives the same question.
- **Difficulty by number shape:** each topic file defines number pools per level, e.g. percents use {10, 20, 25, 50}% at Easy, {5, 12.5, 15, 35}% at Medium and {17.5, 22.5, 37.5}% or chained changes at Hard.
- **Mental-math guard:** a draft is rejected if the answer has more than 4 significant digits (Easy/Medium), needs more than 2 steps, or produces a repeating decimal without a rounding rule.
- **Clean answers:** answers are exact `Rational` values; word problems choose inputs that give whole or terminating answers unless the template asks for rounding.
- **Word-problem variety:** each word template has 6–10 short scenario strings (prices, trains, recipes, classes, tanks) with slots for names, items and units.

**Distractors (for MCQ)**

- Built from named mistakes per template: wrong base for percent change, adding percents instead of chaining, inverting a ratio, dividing instead of multiplying, a dropped decimal place (×10 or ÷10), off-by-one in averages.
- Topped up with near values (answer ± a step that looks plausible) until there are 4 distinct wrong options.
- Rejected if any distractor equals the answer after rounding, or two distractors are equal.
- Estimation questions use evenly spaced options around the answer so only real estimation finds it.

**Bank build (`tools/quant/build-bank.ts`)**

1. For each template and difficulty, draw seeds 1, 2, 3… until the quota is met (about 1,200 questions across \~80 templates, weighted by topic).
2. Drop near-duplicates (same template with the same numbers in a different order).
3. Merge 300 hand-written word problems from `handwritten.json`. Each answer and wrong option is worked out from a formula by `engine/matching/calc.ts` ([0039](../decisions/0039-handwritten-problems-from-formulas.md)).
4. Assign IDs `<templateId>-<e|m|h>-<nnnn>` and write `questions.json` sorted by ID, so diffs stay readable.

**Live generation in the app:** when a user has seen 90% of the bank for a topic and difficulty, the session builder calls the same templates with seeds from 100,000 upward and stores generated questions' seeds with the attempt, so mistakes can be replayed exactly.

## Content pipeline

Content is produced by scripts and Claude, checked by scripts, and committed as JSON. No content goes live without passing validation in CI.

**Vocab: ranking the 1,500 words**

1. Collect public high-frequency GRE word lists (Barron's, Magoosh, Manhattan, ETS practice material, community lists) as plain word lists in `content/sources/wordlists/`, one word per line. Only the words are kept, never definitions.
2. `rank-words.ts` normalizes each word (lowercase, base form) and scores it: +1 for each list containing it, plus a small bonus for appearing near the top of ranked lists. *As built ([0023](../decisions/0023-word-ranking-core-and-broad-lists.md)): +1 per focused GRE list, +0.1 per broad list (3,000–5,000 words), at least one focused list required, ties in a fixed hash order; inflections merged via `content/sources/wordlists/aliases.txt`. Output: `content/ranked-words.json`.*
3. Take the top 1,500 by score. Rank 1–500 = Tier 1, 501–1,000 = Tier 2, 1,001–1,500 = Tier 3.

**Vocab: writing entries**

- Claude writes entries in batches of 100 words, in rank order, following a fixed brief: original one-line meaning, one natural example sentence that makes the meaning guessable from context, 2–3 synonyms, 3 confusable GRE words for distractors.
- Launch target: ranks 1–600. The rest follows at 300+ words a day.

**Vocab checks (`validate-words.ts`)**

- Schema valid; IDs unique; 1,500 ranks with no gaps once complete.
- `example` contains `exampleForm`, and `exampleForm` shares the headword's stem.
- `meaning` at most 90 characters and does not contain the headword.
- Synonyms and confusables differ from the headword; confusables point to real word IDs with the same part of speech.
- Manual review of a random 10% sample per batch before merging.

**Quant checks (`validate-bank.ts`)**

- Schema valid; IDs unique; quotas met per topic and difficulty (at least 40 per topic-difficulty pair).
- Re-run every template from its stored seed and confirm the same answer (catches template edits that silently change answers).
- For MCQ questions: exactly 5 distinct choices and exactly one equal to the answer after rounding.
- Every hand-written problem rebuilt from its formula. The formula's numbers must appear in the question (small common numbers exempt), and the shortcut must reach the same answer.

**Fixing content later:** edit the JSON (or the template) on GitHub → CI validates → deploy. The "Report a problem" link opens a prefilled GitHub issue with the question or word ID.

## Local data model

One Dexie database, `graphite`, version 1. All timestamps are epoch milliseconds; all "day" values are local dates as `YYYY-MM-DD` strings so streaks follow the user's midnight.

| Table | Primary key | Indexes | Holds |
| --- | --- | --- | --- |
| `sessions` | `id` (uuid) | `type`, `status`, `day`, `startedAt` | Type (quant/vocab), mode, settings snapshot, item list, cursor, timer state, status (active, finished, abandoned), score |
| `quantAttempts` | `++id` | `sessionId`, `questionId`, `topic`, `day`, `[topic+difficulty]` | Question ID (or template + seed), difficulty, answer mode, user answer, correct, seconds, flags |
| `wordStates` | `wordId` | `box`, `dueDay`, `starred`, `round` | Leitner box 0–5, due day, seen and correct counts, last result, starred, round, first seen day |
| `wordAttempts` | `++id` | `sessionId`, `wordId`, `day` | Mode, user answer, correct, spelling slip, seconds |
| `mistakes` | `[kind+refId]` | `kind`, `addedAt` | Kind (quant/word), ref ID (or template + seed), streak of correct answers |
| `seen` | `questionId` | `lastSeenDay` | Last day each question was shown (7-day no-repeat rule) |
| `meta` | `key` | — | Settings, schema version, last export date, content version |

**Migrations:** each schema change adds a new `db.version(n)` with an upgrade function; old exports are upgraded on import using the same functions.

**Export format:** one file `graphite-backup-YYYY-MM-DD.json` holding `{ app: 'graphite', schemaVersion, exportedAt, tables: { ... } }` with every table. Import validates with Zod and **replaces** all local data after a confirm dialog. Merging two devices is out of scope.

**Size estimate:** 3 weeks of heavy use is about 4,000 quant attempts and 10,000 word attempts, roughly 3 MB. Well inside browser quotas.

## Core logic

All of this lives in `src/engine/` as pure functions with no React or storage imports, so each piece is unit-tested on its own.

**Numeric answer matching (`numeric-answer.ts`)**

1. Normalize the input: trim, drop commas and spaces, treat a leading `.` as `0.`.
2. Parse to `Rational`: integer, decimal, or fraction `a/b` (including negatives). Anything else is invalid and the keypad prevents it.
3. No rounding rule: correct if the input equals the answer exactly (0.5 = 1/2 = 2/4).
4. Rounding rule: round the answer to the stated place, then require an exact match with the input (so 3.46 is wrong when the nearest tenth, 3.5, is asked).
5. Blank input = skipped.

**Type-in word matching (`word-answer.ts`)** *(Type-in can't be chosen now; kept for sessions saved before [0028](../decisions/0028-remove-type-in-practice.md))*

- Normalize: lowercase, trim, collapse inner spaces.
- Exact match to the headword, `exampleForm` or any variant = correct.
- Otherwise, Damerau–Levenshtein distance of 1 from any of those (and word length 5 or more) = correct with a spelling slip.
- Anything else = wrong.

**Leitner scheduling (`leitner.ts`)**

| Box | Meaning | Next due |
| --- | --- | --- |
| 0 | New, not yet seen | When pulled in as a new word |
| 1 | Learning | Again at the end of the same session, then tomorrow |
| 2 | Familiar | +1 day |
| 3 | Known | +3 days |
| 4 | Solid | +7 days |
| 5 | Retired | Only in later rounds |

- Flashcard Know it, or a correct quiz answer: box + 1. A spelling slip counts as correct.
- Review, or a wrong quiz answer: box 1.
- Unsure: box stays the same, due tomorrow.

**Quant session builder (`quant-builder.ts`)**

- Input: topics, difficulty, length or sprint, answer mode, today's date.
- Pick questions round-robin across chosen topics. Prefer never-seen questions, then those not seen in 7+ days. Fall back to live generation when fewer than 10% remain.
- Answer mode: Typed uses only typed; MCQ uses only questions with `choices`; Mix makes about half MCQ (estimation always MCQ). Choice order is shuffled with the session seed.
- Retry wrong ones: exactly the wrong, skipped and not-reached items of a session. Drill my mistakes: oldest mistake-log items first, up to the chosen length.

**Vocab session builder (`vocab-builder.ts`)**

- Session length 25, 50 (default) or 100 cards.
- Order: due words first (box 1–4 with due day today or earlier, lowest box first), then new words in rank order until the daily cap (default 200 new words per local day) is reached.
- MCQ distractors: the word's confusables first, then random words of the same part of speech and tier.
- Rounds ([0044](../decisions/0044-round-2-browse-and-memory-aids.md)): when every word has been seen, Home offers Round 2. It's a separate deck: `meta` holds the current round, each answer sets that word's `round`, and the queue is the words still to go, ordered starred, box 1, box 2 … box 5.

**Mistake log (`mistakes.ts`)**

- Add: wrong, skipped or not-reached quant attempts; wrong word attempts; flashcard Review marks.
- Correct answer on a logged item: streak + 1, removed at 2. A wrong answer resets the streak to 0.

**Flags and stats (`stats/`)**

- Slow: correct but over 1.5 × `targetSec`. Careless: wrong in under 0.5 × `targetSec`.
- Results and Progress aggregate from attempts on demand; no stored rollups in Phase 1.

**Adaptive difficulty (Phase 2, [0043](../decisions/0043-sprint-adaptive-and-topic-memory.md)):** per-topic level stored in `meta`, starting at Medium. After each Adaptive drill, look at that topic's last 10 attempts from Adaptive drills since its last move: up a level if 8+ are correct and under target time, down if 5+ are wrong.

## Session engine

One engine (`session-machine.ts`) runs both quant and vocab sessions. It holds the item list and a cursor, and saves to `sessions` after every answer, so a session can always be resumed.

**States:** `active` → `paused` (app hidden) → `active` → `finished`, or `abandoned` (discarded by the user, or older than 24 hours).

**Events**

- `answer(value)`: record the attempt, update word state or mistake log, advance the cursor, autosave. Nothing about correctness is shown to the user.
- `skip()`: same as an empty answer.
- `hide()` / `show()`: from the page `visibilitychange` event. Pauses and resumes the clock.
- `timeout()`: per-set timer reached zero. Marks remaining items `notReached` and finishes.
- `finish()`: last item answered, or the user taps End. Computes the score and opens Results.

**Timer**

- Never counts with `setInterval` ticks. The session stores `elapsedMs` plus `activeSince`; the visible clock is `elapsedMs + (now - activeSince)`, redrawn with `requestAnimationFrame`.
- On `hide`, `elapsedMs` absorbs the running time and `activeSince` clears, so a locked phone or closed tab doesn't burn the clock.
- Per-question time = time between the question appearing and the answer, minus any paused time.

**Resume:** on app start, if an `active` or `paused` session exists and is under 24 hours old, Home shows a Resume / Discard banner. Older ones are marked `abandoned` and excluded from stats.

**Write path:** each answer is one Dexie transaction across `sessions`, the attempts table, `wordStates` or `mistakes`, and `seen`. Either all writes land or none do.

## PWA and offline

The whole app, fonts and both content files are precached on the first visit, so every Phase 1 feature works with no network afterwards.

- **Service worker:** vite-plugin-pwa in `generateSW` mode. Precache the app shell, fonts, icons, `questions.json` and `words.json` (content is imported as JSON modules so it is versioned with each build).
- **Updates:** `registerType: 'prompt'`. When a new version is ready, a full-screen update page replaces the app, except during an active session, where it waits until the session ends or is paused ([0030](../decisions/0030-full-screen-update-page.md)).
- **Manifest:** name "Graphite", `start_url` and `scope` `/graphite/`, `display: standalone`, theme and background colors from the paper palette, icons at 192, 512 and 512 maskable.
- **iOS:** `apple-touch-icon` (180 px), `apple-mobile-web-app-capable`, status bar style, and safe-area padding for the notch and home bar.
- **Install prompt:** on Android and desktop, capture `beforeinstallprompt` and show an Install button in Settings and once on Home. On iOS, show a one-time "Share → Add to Home Screen" hint.
- **Storage persistence:** call `navigator.storage.persist()` after the first finished session so the browser is less likely to clear data. Show the result in Settings.
- **Export reminder:** if the last export is more than 3 days old, show a small reminder on Home.

## Reminders

Added by [0037](../decisions/0037-push-reminders-with-on-device-text.md). Opt-in; everything else works without it.

- **Service worker:** `src/sw.ts` with `injectManifest`, replacing `generateSW`. Caching and the update flow are unchanged.
- **Timing:** `engine/scheduling/reminder-plan.ts` turns study state into wake-up times. A plan replaces the last one on each move between screens, when the app is hidden, and after each wake-up.
- **Message:** the push handler reads IndexedDB and writes the text on the phone.
- **Service:** `push-server/`, on Cloudflare Workers with a D1 database ([0038](../decisions/0038-reminder-service-on-cloudflare.md)). `PUT` and `DELETE /subscription` store a push address and wake-up times. A scheduled check each minute sends what's due. Endpoints are limited to the browsers' push services, so it can't be aimed elsewhere.
- **Configuration:** `VITE_PUSH_SERVER_URL` and `VITE_PUSH_PUBLIC_KEY`, committed in `.env.production` because neither is secret. Without them the Settings section stays hidden. The private key is stored only in Cloudflare.

## Sharing

Share cards are drawn on a canvas in the browser and handed to the system share sheet. No server, no upload until the user picks a destination.

1. `share/cards.ts` draws a 1080 × 1350 px card (portrait, fits WhatsApp and iMessage previews) with the paper palette: "Graphite" wordmark, date, session type, score, accuracy, total and average time, topic breakdown (top 4), and days to exam.
2. Fonts are awaited with `document.fonts.ready` before drawing so the card never falls back to system fonts.
3. The canvas becomes a PNG `File`. A plain-text summary is built alongside, e.g. "Graphite · Quant drill · 18/20 (90%) · avg 21s · percents 6/6".
4. If `navigator.canShare({ files })` is true, call `navigator.share({ files, text })`. Otherwise copy the text to the clipboard and download the PNG, with a small "Copied and saved" toast.
5. Phase 2 adds a history card (7 or 14 days) using the same drawing helpers plus a small hand-drawn bar chart.

## UI implementation

Five tabs, one task per screen, built from a small set of shared components and design tokens.

**Routes**

| Route | Screen | Phase |
| --- | --- | --- |
| `#/` | Home: countdown, today's plan, Quick drill, Continue vocab, resume and update banners | 1 |
| `#/quant` | Quant setup | 1 |
| `#/quant/session/:id` | Drill (full-screen, tab bar hidden) | 1 |
| `#/vocab` | Vocab setup: mode, deck, length | 1 |
| `#/vocab/session/:id` | Flashcard / MCQ / fill-the-blank / Sentence Equivalence session (full-screen) | 1 |
| `#/results/:id` | Results for either session type, with Share | 1 |
| `#/mistakes` | Mistake log and Drill my mistakes | 1 |
| `#/progress` | Streak and totals (Phase 1); trends (Phase 2) | 1 |
| `#/settings` | Goals, exam date, defaults, theme, install, export/import, reset | 1 |
| `#/vocab/browse` | Word search and browse | 2 |

**Shared components:** `Keypad` (0–9, `.`, `−`, `/`, backspace, Submit; physical keyboard mapped), `ChoiceList` (A–E, keys 1–5 and A–E), `Flashcard` (tap or Space to flip; swipe left/right or keys 1/2/3 to mark), `TypeInField`, `SessionHeader` (progress "7 / 20" and timer), `ResultSummary`, `TopicBreakdown`, `ShareButton`, `Banner`, `Toast`.

**Fractions and powers:** `MathText` draws stacked fractions and raised powers from the bank's plain text at display time ([0040](../decisions/0040-stacked-fractions.md)). The stored text never changes.

**Design tokens (`tokens.css`)**

- Colors as CSS variables with light and dark sets: `--paper` warm off-white, `--graphite` text, `--graphite-soft` secondary text, `--rule` faint lines, `--ink` single blue accent, `--good` and `--bad` used only on results screens.
- Type: Newsreader for words and headings; Inter for UI with `font-variant-numeric: tabular-nums` on timers and scores.
- Spacing on an 8 px scale; corner radius 12 px for cards; tap targets at least 48 px.
- Study cues as CSS only: a faint ruled-line background on flashcards, an index-card aspect ratio, a pencil-tick SVG for correct items on results.
- Motion: card flip 250 ms ease-out; respects `prefers-reduced-motion`.

**Theme:** follows the system by default, with a Light / Dark / System switch in Settings stored in `meta`.

## Build, CI and deploy

Every push to `main` is checked and, if green, published to `ashwynkmr.github.io/graphite` in about 2 minutes. A failing check blocks the deploy and the live site stays as it was.

**One-time setup**

1. Create the public repo `ashwynkmr/graphite`.
2. Settings → Pages → Source: **GitHub Actions**.
3. In `vite.config.ts`: `base: '/graphite/'`.
4. The existing `ashwynkmr.github.io` site is untouched; GitHub serves the new repo under its path automatically.

**Workflow (`.github/workflows/deploy.yml`)**

1. Trigger: push to `main`, plus manual run.
2. Setup Node 20 with npm cache; `npm ci`.
3. `npm run typecheck` → `npm run lint` → `npm test` (Vitest).
4. `npm run content:validate` (both validators).
5. `npm run build`, then Playwright run-throughs in `tests/e2e/` against `vite preview`, then the reminder service's checks.
6. Upload `dist/` with `actions/upload-pages-artifact` and publish with `actions/deploy-pages`.

**Scripts in `package.json`:** `dev`, `build`, `preview`, `typecheck`, `lint`, `test`, `test:e2e`, `content:rank-words`, `content:build-bank`, `content:validate`.

**Content-problem reports:** `.github/ISSUE_TEMPLATE/content-problem.yml` with fields for item ID, what's wrong and the expected answer. The in-app link opens `github.com/ashwynkmr/graphite/issues/new?template=content-problem.yml&id=<id>`.

**Cost:** GitHub Actions and Pages are free for public repos.

## Testing strategy

Tests focus where a bug would quietly mislead a learner: answer matching, scheduling, generators and saving.

| Layer | What is tested | Tool |
| --- | --- | --- |
| Rational math and answer matching | Equivalent forms, rounding rules, negatives, invalid input, blank = skip | Vitest, table-driven cases |
| Word matching | Exact, variants, inflected forms, one-letter slips, short words not forgiven | Vitest |
| Generators | Every template × difficulty × 200 seeds: valid schema, answer passes the mental-math guard, 4 distinct distractors, none equal to the answer | Vitest (property-style loop) |
| Leitner and rounds | Box moves for every action; due dates across midnight; daily new-word cap; Round 2 ordering | Vitest with a fixed clock |
| Session builders | No repeats within 7 days; Mix ratio; retry and mistake drills contain exactly the right items | Vitest with fake-indexeddb |
| Session engine | Autosave, resume, pause on hide, timeout marks not-reached | Vitest with fake timers |
| Export/import | Round trip gives identical tables; old schema upgrades | Vitest |
| Smoke flows | 1) Quick drill → results → retry wrong; 2) Vocab MCQ session → mistake log; 3) reload mid-drill → resume | Playwright, mobile viewport |
| Manual | Install on iPhone and Android, airplane-mode run, share sheet on both | Checklist before launch |

## Build plan for Claude Code

Phase 1 is ten steps, each ending in a checkpoint you can see. Steps 3–4 and 7 are content work and can run in parallel with app steps.

1. **Scaffold and deploy an empty shell.** Vite + React + TS, dependencies, `tokens.css`, HashRouter with the five tabs, vite-plugin-pwa, deploy workflow. *Checkpoint: a blank Graphite page loads at `ashwynkmr.github.io/graphite` and installs on a phone.*
2. **Engine foundations.** `Rational`, numeric and word matching, seeded RNG, Leitner, with unit tests. *Checkpoint: tests green in CI.*
3. **Generators and bank.** Nine topic files (\~80 templates), `build-bank`, `validate-bank`; commit `questions.json`. *Checkpoint: about 1,200 generated questions pass validation; sample of 50 reviewed by you.*
4. **Hand-written word problems.** \~300 short problems in `handwritten.json`, merged into the bank. *Checkpoint: bank at 1,500.*
5. **Data layer.** Dexie schema, repos, export/import with round-trip test.
6. **Quant flow.** Setup, Drill (Keypad, ChoiceList, SessionHeader), session engine, Results with breakdown, flags and review, Retry wrong. *Checkpoint: a full drill on your phone, including reload and resume.*
7. **Vocab content.** Rank the words from the public lists, then write and validate entries for ranks 1–600. *Checkpoint: 600 words pass validation; 10% sample reviewed.*
8. **Vocab flow.** Setup, Flashcard / MCQ / fill-the-blank / Sentence Equivalence sessions, Results.
9. **Home, Mistake log, Progress (basic), Settings, Share card.**
10. **Launch pass.** Playwright smoke tests, offline test, install on iPhone and Android, manual checklist. *Checkpoint: Phase 1 live; send the link.*

After launch: add 300+ words a day until all 1,500 are in, then Phase 2 (trends dashboard, adaptive difficulty, Round 2, Browse, history share).

**`CLAUDE.md` for the repo should state:**

- Read `docs/PRD.md` and `docs/TRD.md` before starting a step; build one step at a time and stop at each checkpoint.
- `src/engine/` stays pure: no React, Dexie or DOM imports; every change there ships with tests.
- Never type a quant answer by hand; answers come from templates or the hand-written evaluator.
- Run `npm run content:validate` and `npm test` before every commit; never commit content that fails validation.
- Mobile-first: check every screen at 375 px wide first; use only tokens from `tokens.css`.
- No right/wrong feedback during sessions, ever. Results only at the end.
- No network calls, analytics or third-party scripts at runtime.

## Open technical questions

None of these block step 1. Each has a default.

- [ ] **Where Claude Code runs:** on your laptop (direct GitHub push, normal web access for word lists) or in a cloud session connected to the repo? Default: your laptop.
- [ ] **Word-list sources:** should Claude fetch the public lists, or will you drop a few lists you trust into `content/sources/wordlists/`? Default: Claude fetches, you approve the final 1,500.
- [ ] **Content review time:** can you spend about 20 minutes reviewing 50 questions and 60 words before launch? Default: yes, at checkpoints 3 and 7.
- [ ] **Session length for vocab:** 50 cards per session by default, so 200 new words means about 4 sessions a day plus reviews. Keep it? Default: yes.
- [ ] **Existing site:** does `ashwynkmr.github.io` have a custom domain set? If so, the app URL becomes `<your-domain>/graphite`. Default: no custom domain.
