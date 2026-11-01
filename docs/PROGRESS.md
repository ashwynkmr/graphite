# Build log

Running log of what's built, what's live and known issues. Newest first.

## Live now

`v0.1.0` (Milestone A) at https://ashwynkmr.github.io/graphite/: name prompt, Home with greeting, countdown and Quick drill; quant drills with topic and difficulty pickers; results with review and Retry wrong ones. Vocab practice with all 1,500 words (swipe flashcards, multiple choice, fill the blank, type-in). Installable and offline. Mistakes, Progress and most of Settings are placeholders until Milestone C.

## Next up (handoff)

Read this and `CLAUDE.md` first when starting a new session.

- **Where we are:** Milestone A shipped as `v0.1.0` (Oct 31). Study started Nov 1; exam Nov 24.
- **Next step:** Checkpoint B2 on the full deck, then release `v0.2.0` (CHANGELOG, retro, tag, GitHub Release). All 1,500 entries are written ([0026](decisions/0026-write-all-1500-entries-before-launch.md)).
- **Vocab screens (step 8) are built and approved** with ranks 1–100 ([0024](decisions/0024-vocab-screens-before-all-600-words.md), [0025](decisions/0025-swipe-flashcards-and-mixed-practice.md)).
- **Also planned (PRD v0.6, Nov 1):** two-level reset and a fuller Home in step 9; study nudges and notes for the second user in Phase 2; reminders outside the app in Phase 3, needing a decision first.
- **Then:** step 9 (Milestone C: mistake log screen, progress, two-level reset, fuller Home).
- **How we work:** review gate ([0016](decisions/0016-review-gate-staging-before-commit.md)). At each checkpoint run `npm run staging` (new tunnel URL each time), summarise, ask 3–5 questions, and commit nothing until Ashwyn approves. Log feedback as FB-NN (last used: FB-47). Next decision number: 0027.
- **Open items:** install/offline not yet verified on a real phone against the live site; README screenshots deferred to step 11; if a phone keeps the old icon after re-adding, rename the icon files to bust caches (needs approval).

## Steps

| Step | What | Status | Date |
| --- | --- | --- | --- |
| 1 | Scaffold and deploy an empty shell | Done; A1 passed (installed on phone) | 2026-10-31 |
| 2 | Engine foundations | Done | 2026-10-31 |
| 3 | Generators and question bank | Done; A2 reviewed; difficulty raised after feedback | 2026-10-31 |
| 4 | Data layer | Done; A3 approved | 2026-10-31 |
| 5 | Quant flow + minimal Home | Done; A3 approved; `v0.1.0` | 2026-10-31 |
| 6 | Ranked word list | Done; approved in chat | 2026-11-01 |
| 7 | Word entries | Done: all 1,500 (plan was 600) | 2026-11-01 |
| 8 | Vocab flow | Done; approved on staging | 2026-11-01 |

## Notes

### 2026-11-01: All 1,500 word entries
- Ranks 101–1,500 written in batches of 100 after Ashwyn asked to skip sample reviews (FB-45, FB-47; [0026](decisions/0026-write-all-1500-entries-before-launch.md)). Every batch passed `validate-words.ts` before its commit.
- Once all entries existed, the part-of-speech check covered every look-alike. Adverbs are exempt because the deck has only three.
- A final audit reworded two duplicate meanings (aberrant/anomalous, penury/indigence).
- 534 tests green.

### 2026-11-01: First 100 entries and the vocab screens
- `content/words.json`: ranks 1–100, written fresh. `tools/vocab/check-words.ts` checks rank order, no stem of the word in its meaning, the example contains `exampleForm`, and confusables that are in the deck, share the part of speech and aren't synonyms.
- Screens built before the other 500 entries ([0024](decisions/0024-vocab-screens-before-all-600-words.md)): setup (practice multi-select, Today/New/Starred, 25–400 dial), session (swipe flashcards, multiple choice, fill the blank, type-in), results.
- Swipe marking with faded marks, a star on the card, an ink-tinted back, a one-time sway to show the card moves ([0025](decisions/0025-swipe-flashcards-and-mixed-practice.md)). A missed quiz word is never requeued, so nothing hints it was wrong; a flashcard marked Review comes back once.
- Testing caught a synonym used as a distractor (taciturn for reticent); the engine and validator now exclude synonyms both ways.
- Feedback FB-34 to FB-44. 533 tests green.

### 2026-11-01: Step 6, ranked word list
- 12 public lists (words only) in `content/sources/wordlists/`, origins in `sources.json`. `npm run content:rank-words` writes `content/ranked-words.json`: 1,500 words, tiers of 500 ([0023](decisions/0023-word-ranking-core-and-broad-lists.md)).
- Seven focused GRE lists score 1 each; five broad lists add 0.1 each as a tie-breaker. 1,112 of the 1,500 are on two or more focused lists; the cut-off score is 1.3.
- Inflections merge via `aliases.txt`; seven adjective forms stay separate (FB-32). Testing caught a bug where unreadable entries were dropped silently instead of reported.
- 501 tests green.

### 2026-11-01: Requests after A3; question-count dial
- Drill length on Quant setup is a swipe dial, 5 to 40 in steps of 5 ([0022](decisions/0022-question-count-dial.md)); reusable as `src/ui/Dial.tsx`. Two phone fixes before approval: horizontal-only scrolling, and the Start bar drawn above the dial.
- PRD v0.6 records four requests for later: reset progress or everything (step 9), a fuller Home (step 9), study nudges from the user's own results (Phase 2), and notes from Ashwyn for the second user (Phase 2). Feedback FB-22 to FB-29.
- 487 tests green.

### 2026-10-31: A2 feedback, Steps 4–5, A3 (approved, `v0.1.0`)
- **Review gate** ([0016](decisions/0016-review-gate-staging-before-commit.md)): from here on, every checkpoint runs on an HTTPS staging tunnel (`npm run staging`) and nothing is committed until Ashwyn approves.
- **Difficulty up one level** ([0017](decisions/0017-difficulty-up-one-level.md)): every template rewritten so Easy = old Medium, Medium = old Hard, plus a new Hard tier (inverse proportion, map area, reverse percent and interest, 2^(x+1) + 2^x = 48, two-digit units digits, overlapping means and more). Bank regenerated: 1,200 questions, 99% with choices.
- **Distractors** ([0018](decisions/0018-distractors-real-mistakes.md)): at least two named-mistake options per question; options more than 12× from the answer dropped. Unit-tested in `finalize.test.ts`.
- **Icon**: three directions in `tools/icons/` (pencil, notebook, cap); after A3 feedback, a hybrid (`spiral.svg`), then a cursive pencil G (`cursive.svg`, rejected), then Newsreader's lowercase g on the notebook page with a pencil (`g-pencil.svg`, staging default) or a fountain pen (`g-pen.svg`), both generated by `build-g.mjs`. Previews in `docs/feedback/assets/`.
- **After A3 feedback**: cheer word removed, name-only encouragement ([0020](decisions/0020-name-only-encouragement.md)); difficulty is a multi-select and drills mix the chosen levels; old single-difficulty settings upgrade automatically.
- **Name and encouragement** ([0019](decisions/0019-personal-name-and-encouragement.md)): first-run name prompt with an optional cheer word; greeting and a daily line on Home, score-sized encouragement on Results; editable in Settings.
- **Data layer**: Dexie schema per the TRD, settings/profile in `meta`, export/import with a round-trip test, one transaction per answer.
- **Quant flow**: setup with a topic picker ("Mixed: give me anything" default), Quick drill on Home, drill screen (keypad or A–E choices, timestamp clock that pauses when hidden, autosave, resume banner, timeout), results (score, timings, topic/difficulty/mode breakdowns, slow and careless flags, review with shortcuts, retry wrong ones, new drill).
- Fixed during testing: a keypad bug where fast typing could drop characters (stale state), and ruled lines that didn't line up with the question text.
- 485 tests green; offline download 957 KB.

### 2026-10-31: Step 3
- 73 templates across 9 topics (`src/engine/generators/topics/`), against the TRD's "about 80". Each topic has 7–9 templates covering all three difficulties; more can be added for weak topics in Phase 2.
- `finalize.ts` applies the mental-math guard (≤ 4 significant digits at Easy/Medium, ≤ 5 at Hard; no repeating decimal without a rounding rule) and builds 5 choices: named-mistake distractors first, then near values, all at the answer's precision so no option gives itself away.
- Property test: every template × difficulty × 200 seeds checks the schema, the guard, 5 distinct choices with exactly one correct, and determinism.
- `content/questions.json`: 1,200 questions (40–55 per topic × difficulty), all with choices (the TRD floor is 70%). `validate-bank.ts` rebuilds every question from its stored seed and fails CI on any difference.
- The TRD question schema gained a `format` field (number or fraction), and the hand-written `calc` expression lives in `source`.
- Reviewing printed samples caught content issues the tests couldn't: a non-integer distractor ("1013"), an explanation that used a reduced denominator (3/500 instead of 6/1000), unrealistic word-problem sizes ("a team played 1,600 games") and a few awkward phrasings. All fixed before generating the bank.

### 2026-10-31: Step 2
- `src/engine/matching/rational.ts`: exact BigInt rationals with parse, arithmetic, integer powers, half-away-from-zero rounding, terminating-decimal checks and significant digits (for the step 3 mental-math guard).
- `numeric-answer.ts`: equivalent forms, rounding rules, blank = skipped, plus `isValidPartialInput` for the keypad.
- `word-answer.ts`: case-insensitive, variants and the example's inflected form; a Damerau–Levenshtein distance of 1 on words of 5+ letters = spelling slip.
- `rng.ts`: mulberry32, checked against the canonical implementation over 20,000 draws; reference values pinned in a test so template seeds can't silently change.
- `scheduling/leitner.ts`: every box × grade transition tested; two edge cases settled in [0015](decisions/0015-leitner-edge-cases.md).
- 216 unit tests, all green.

### 2026-10-31: Step 1
- Vite 5, React 18, TypeScript strict, HashRouter, vite-plugin-pwa (`registerType: 'prompt'`), Dexie 4 and Zod installed.
- Fonts are self-hosted Latin-only woff2 files (Newsreader 400/500/400 italic, Inter variable), about 120 KB in total. The full Fontsource packages would have put every language subset into the offline precache.
- App icons are drawn by `tools/make-icons.mjs` (no image dependencies); the maskable icon keeps the mark inside the 80% safe zone.
- First production build: 310 KB precache, JS 57 KB gzipped.
- CI runs typecheck → lint → test → content:validate → build → deploy. The content validators are placeholders until steps 3 and 7.

- **A3 round 2:** difficulty picker redrawn as check-mark toggle chips after "multi-select still doesn't work" (root cause: ambiguous control plus a stale cached build); the update bar now shows on every tab. Icon finalised as the serif g with a fountain pen ([0021](decisions/0021-app-icon-serif-g-with-pen.md)).

## Known issues
- Install and offline over the staging tunnel weren't tested on a real phone during A3; the live site is checked after deploy.
- The mistake log fills from drills, but its screen arrives in step 9 (Milestone C).
- README screenshots will be captured with Playwright in the launch pass (step 11).
