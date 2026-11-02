# Build log

Running log of what's built, what's live and known issues. Newest first.

## Live now

`v2.0.0` (Phase 2 complete) at https://ashwynkmr.github.io/graphite/: everything below, plus Sprint, Adaptive, per-topic setups, Browse and search, Round 2, memory aids, a full Progress dashboard, history share, mistake filters, nudges on Results and a What's New screen. From Phase 1: name prompt, a full Home, and quant drills from 1,500 questions with topic and difficulty pickers; results with review, Retry wrong ones and Report a problem. Vocab practice with all 1,500 words (swipe flashcards, multiple choice, fill the blank, Sentence Equivalence), results grouped by Missed, Unsure and Got right, and a redo round. The mistake log with Drill my mistakes, Progress totals, Share, and Settings with goals, theme, backup and two-level reset. Optional reminders and personal notes for the second user. Installable and offline.

## Next up (handoff)

Read this and `CLAUDE.md` first when starting a new session.

- **Where we are:** Phase 2 is complete and shipped as `v2.0.0` (Nov 1). Study started Nov 1; exam Nov 24.
- **Next step:** none planned. Anything further waits for Ashwyn: real results may show which topics need more templates.
- **Later, if wanted:** a harder Sentence Equivalence bank with exam-style sentences and decoy pairs ([0029](decisions/0029-sentence-equivalence-hand-checked-pairs.md)).
- **How we work:** for new work, branch from `main`, commit once checks pass, and never push to `main` until Ashwyn approves the launch ([0042](decisions/0042-phase-2-on-a-branch-commit-as-we-go.md)). At each checkpoint run `npm run staging` (new tunnel URL each time; the app is under `/graphite/`), summarise and ask 3–5 questions. Log feedback as FB-NN (last used: FB-109). Next decision number: 0049. Each release needs a new `RELEASE` and list in `WhatsNewScreen.tsx`. Test builds of the notes use `VITE_NOTE_EVERY_MINUTES` and must never be the live build.
- **Open items:** Round 2 on a real phone; reminders and notes on Android, including the answer buttons; a reminder run going over Cloudflare's 10 ms limit and retrying; the Android install button not yet tried; test screens at about 664 px tall as well as 812; if a phone keeps the old icon after re-adding, rename the icon files to bust caches (needs approval).

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
| 8 | Vocab flow | Done; B2 approved; `v0.2.0` | 2026-11-01 |
| 9 | Mistake log, Home, Progress, Settings, Share card | Done; C1 and C2 approved | 2026-11-01 |
| 10 | 300 hand-written problems; bank at 1,500 | Done; C4 approved | 2026-11-01 |
| 11 | Launch pass: run-throughs, Report a problem, screenshots | Done; real-phone checklist passed; `v1.0.0` | 2026-11-01 |

## Notes

### 2026-11-01: Phase 2 complete, `v2.0.0`
- What's New screen built ([0048](decisions/0048-whats-new-screen.md)). An install of the live build, with saved progress and a paused drill, updated to this one in Chromium: the screen showed once, the data and paused drill held, and the new features opened. Feedback FB-108.

### 2026-11-01: Phase 2, checkpoint 4
- Study nudges added under the Results buttons, a paused session first ([0047](decisions/0047-nudges-on-results.md)). Chart lines now step by day when dragged. Not live. Feedback FB-106 and FB-107.

### 2026-11-01: Phase 2, checkpoint 3
- Dashboard, mistake-log filters and a 7- or 14-day share card built ([0046](decisions/0046-progress-dashboard.md)). Not live. Checked in Chromium with seeded data; not yet on a real phone. Feedback FB-104 and FB-105.

### 2026-11-01: Phase 2, checkpoint 2
- Browse and search, Round 2 and 231 memory aids built ([0044](decisions/0044-round-2-browse-and-memory-aids.md)). Not live.
- The longest memory-aid card fits at 375 × 664 with no scrolling. Round 2 was tested with a seeded deck, since nobody has seen all 1,500 words yet.
- Review found the phone keyboard hid search results behind the filters, and asked for a sprint dial ([0045](decisions/0045-sprint-time-dial-and-search-layout.md)). Feedback FB-100 to FB-103.

### 2026-11-01: Phase 2, checkpoint 1
- Sprint, Adaptive and per-topic setups built and reviewed on Ashwyn's phone ([0043](decisions/0043-sprint-adaptive-and-topic-memory.md)). Not live. Feedback FB-94 to FB-99.
- A sprint's questions that were never reached are dropped, so they can't flood the mistake log. Retries, mistake drills and Quick drill are never sprints, even if the last setup was.

### 2026-11-01: Phase 1 complete, `v1.0.0`
- Ashwyn reported the real-phone launch checklist with "Tests are passing", as one result rather than item by item. Feedback FB-91 to FB-93.
- Ashwyn asked for answers inside the nightly notification. iPhones don't offer that to web apps, so it stays as it is. Android should show the buttons; not yet tested.

### 2026-11-01: Personal notes shipped
- Notes for the second user are encrypted in the app and open only for a matching saved name ([0041](decisions/0041-personal-notes-sealed-in-the-app.md)). Feedback FB-85, FB-86, FB-89 and FB-90.
- Ashwyn tested them on an iPhone with a 3-minute gap and asked to drop the second signature, since the title already names the sender.
- An install of the previous live build updated in Chromium: saved data stayed, a matching name got 23 notes and 5 questions in its plan, and another name got none. Headless Chromium didn't show the pushed notifications, so the text after FB-89 hasn't been seen on a phone.

### 2026-11-01: Launch pass so far, and stacked fractions
- A Phase 1 audit found Report a problem was never built. It's now on Results and in the Mistake log, opening a GitHub issue with the ID filled in.
- 12 browser run-throughs run before every deploy: scoring, no mid-session verdicts, clearing mistakes, resuming, offline, no outside requests, backup, resets, fit at 375 px and fractions. They confirmed mistakes clear after two correct answers in a row, which had only been unit-tested.
- Fractions are stacked and powers raised, on screen only ([0040](decisions/0040-stacked-fractions.md)). Feedback FB-85 to FB-88.
- Flashcard marks still use red and green during a session, against the rule that keeps those colours to results. They've been there since B2 and label the user's own choice. Left as is, and told to Ashwyn.

### 2026-11-01: Checkpoint C4, step 10
- 300 word problems in `content/handwritten.json`, with each answer and wrong option worked out from a formula ([0039](decisions/0039-handwritten-problems-from-formulas.md)). The bank is now 1,500, and the original 1,200 are unchanged. Feedback FB-83 and FB-84.
- The validator now checks each formula's numbers against its question and each shortcut against its answer. That caught a formula giving 35 instead of 31. Reading all 300 caught problems no check could, such as drafting left in prompts and Easy problems that were too gentle.
- 660 tests green; offline download about 1.68 MB.

### 2026-11-01: Checkpoint C3, push reminders
- Opt-in reminders that follow how the user studies, timed and written on the phone ([0037](decisions/0037-push-reminders-with-on-device-text.md)). The server in `push-server/` receives a push address and wake-up times only. Feedback FB-78 to FB-80.
- Moved to a custom service worker; a browser test ran the update from the live build, then offline use.
- Testing caught a paused session being nudged repeatedly and a daily limit that ignored reminders already sent.
- Confirmed on a real iPhone: delivery, the on-device message, and opening the app from the notification, first against a temporary server and then the live service. 621 app tests and 26 service tests green.
- A security incident at Northflank moved the service to Cloudflare Workers before deployment ([0038](decisions/0038-reminder-service-on-cloudflare.md)). Measured 2 to 6 ms per scheduled run against a 10 ms limit.

### 2026-11-01: Checkpoint C2, Share card and reminders
- Share on both results screens: a 1080 × 1350 image drawn on the device and a text summary, with copy-and-save where sharing isn't offered ([0036](decisions/0036-share-card-drawn-up-front.md)). Testing also caught an empty "0 of 0" card after a vocab session with no answers.
- Reminders stay in the app for now ([0035](decisions/0035-in-app-reminders-only.md)). Feedback FB-73 to FB-77.
- 587 tests green. The real share sheet is untested on a phone.

### 2026-11-01: Checkpoint C1, step 9 without Share
- Home built from a mix of two options: desk layout and tally marks, plus a suggestion card ([0032](decisions/0032-home-desk-layout-tally-and-nudge-card.md)). Mistake log with Drill my mistakes, Progress totals, full Settings, backup and two-level reset ([0034](decisions/0034-mistake-drills-and-reset-scope.md)). Feedback FB-66 to FB-72.
- Testing the built app caught that the suggestion card could never appear after mixed Quick drills, since 3 drills give a topic about 7 answers and the rule asked for 10 ([0033](decisions/0033-suggestion-rules-reach-back-and-thresholds.md)). It also caught the wordmark turning italic in an italic sentence.
- The theme setting existed but nothing applied it until now.
- 578 tests green; offline download about 1.56 MB. Export on a real iPhone is untested.

### 2026-11-01: The gRAPHITE wordmark
- The name is now a `Wordmark` component on the setup label, update label and update sentence ([0031](decisions/0031-wordmark-small-g-caps.md)). Feedback FB-61 to FB-65.
- Testing caught the serif pushing the first line of the update sentence 2 px apart, and showed that an update page is drawn by the outgoing build, so a reviewer sees old styling on the first one.
- A byte change to the built `dist/sw.js` triggers a real update page on staging without touching source.

### 2026-11-01: Checkpoint B2 and `v0.2.0`
- Type-in removed ([0028](decisions/0028-remove-type-in-practice.md)); Sentence Equivalence added from 661 of 764 candidate pairs, each read in its sentence ([0029](decisions/0029-sentence-equivalence-hand-checked-pairs.md)); full-screen update page, held during sessions ([0030](decisions/0030-full-screen-update-page.md)). Feedback FB-52 to FB-60.
- End session failed on Ashwyn's phone but not in desktop Chromium, so the exact cause wasn't confirmed. The button was below the fold and relied on `window.confirm`, which some in-app browsers refuse. It moved to the header and asks on the page, and Ashwyn confirmed it works.
- An end-to-end run on the built app covered a real service-worker update, a session resume and a full Sentence Equivalence session. Testing also removed a giveaway pair (lucid/pellucid).
- 541 tests green; offline download 1,483 KB.

### 2026-11-01: All 1,500 word entries
- Ranks 101–1,500 written in batches of 100 after Ashwyn asked to skip sample reviews (FB-45, FB-47; [0026](decisions/0026-write-all-1500-entries-before-launch.md)). Every batch passed `validate-words.ts` before its commit.
- Once all entries existed, the part-of-speech check covered every look-alike. Adverbs are exempt because the deck has only three.
- A final audit reworded two duplicate meanings (aberrant/anomalous, penury/indigence).
- Full-deck review on staging: sessions no longer grow when cards are marked Review, results list Missed, Unsure, then Got right, and a redo button repeats missed words as flashcards until all are right ([0027](decisions/0027-fixed-session-size-missed-words-first.md), FB-48 to FB-50).
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
