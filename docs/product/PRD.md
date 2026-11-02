# Graphite — Product Requirements (PRD)

Nov 1, 2026 · @Ashwyn · Draft v0.14 (v0.14: how Round 2, Browse and memory aids work, [0044](../decisions/0044-round-2-browse-and-memory-aids.md); v0.13: how Sprint, Adaptive and per-topic defaults work, [0043](../decisions/0043-sprint-adaptive-and-topic-memory.md); v0.12: stacked fractions, [0040](../decisions/0040-stacked-fractions.md); v0.11: reminder service on Cloudflare, [0038](../decisions/0038-reminder-service-on-cloudflare.md); v0.10: opt-in usage-based push reminders, [0037](../decisions/0037-push-reminders-with-on-device-text.md); v0.9: reminders stay inside the app, since superseded; v0.8: Home layout and suggestion rules as built, [0032](../decisions/0032-home-desk-layout-tally-and-nudge-card.md), [0033](../decisions/0033-suggestion-rules-reach-back-and-thresholds.md), mistake drills and reset scope, [0034](../decisions/0034-mistake-drills-and-reset-scope.md); v0.7: Type-in removed, Sentence Equivalence added, [0028](../decisions/0028-remove-type-in-practice.md), [0029](../decisions/0029-sentence-equivalence-hand-checked-pairs.md); v0.6: drill length 5–40 on a dial, reset account, a fuller Home, study nudges and reminders, a personal note for the second user; v0.5: difficulty raised one level, name and encouragement added; see decisions 0017–0019)

> Living document. Scope changes are recorded in the [decision log](../decisions/README.md) and [ROADMAP](ROADMAP.md); this file is updated to match and the version above bumped.

## Overview

Graphite is a free, installable web app for two jobs: fast mental-math drills and high-frequency GRE vocabulary. It is built for heavy daily use from about Nov 1 until the GRE on Nov 24, 2026, so it needs enough content that it never feels repetitive.

**Problem.** Full GRE quant prep tools spend time on long multi-step problems. What slows most test-takers down is arithmetic speed: percents, fractions, ratios and estimation done in the head. Vocab tools are either paid or cluttered.

**Goals**

- Build mental calculation speed and accuracy with timed, scored drills.
- Learn the 1,500 most frequent GRE words through flashcards, multiple choice, fill the blank and Sentence Equivalence practice.
- Feel fresh for 3+ weeks of daily use: 1,500+ quant questions with no obvious repeats, ready before Nov 24.
- Cost $0 to build, host and share.

**Non-goals**

- Full GRE quant prep (geometry proofs, multi-step algebra, data interpretation sets).
- Verbal sections (text completion, reading comprehension).
- Accounts, login or sync across devices.
- App store release.

## Users and usage context

Two users, no accounts: Ashwyn and one other person, each on their own phone and laptop, each with their own progress.

| User | Need | Usage pattern |
| --- | --- | --- |
| Ashwyn (owner) | Speed up mental math, learn GRE words, maintain the content bank | Several sessions a day from \~Nov 1 to the exam on Nov 24, phone and laptop |
| Second user | Same practice, zero setup | Opens a shared link, adds it to home screen |

**Usage assumptions**

- Sessions are short and frequent: 5–15 minutes, often on a phone, sometimes offline.
- Heavy volume: roughly 100–200 quant questions, 200 new words and their reviews a day per user.
- Progress stays private on each device. Phone and laptop keep separate stats. Anyone can share a session's stats or their history with someone else using a Share button.
- The owner edits content by changing JSON files in the GitHub repo, not through an admin screen.

### User stories

Each story is written from the learner's side and tagged with its release phase. Acceptance criteria are what must be true for the story to count as done.

| ID | As a learner, I want to… | Acceptance criteria | Phase |
| --- | --- | --- | --- |
| US-01 | Open a link on my phone and add the app to my home screen | Works from the shared URL with no sign-up; installs on iOS Safari, Android Chrome and desktop Chrome/Edge; opens full-screen with its own icon | 1 |
| US-02 | Start a timed quant drill in two taps | Home has a Quick drill button (20 mixed questions, Mix answer mode, current difficulty); first question appears in under 1 second | 1 |
| US-03 | Choose topics, difficulty, length, answer mode and timer | All setup options from Feature 1 available; last-used settings are remembered | 1 |
| US-04 | Answer by typing or by picking from five options | Keypad accepts digits, decimal point, minus and fraction slash; equivalent forms marked correct; MCQ shows A–E | 1 |
| US-05 | See my score and analysis only when the session ends | No right/wrong shown mid-session; results show score, accuracy, time, topic and difficulty breakdown, slow/careless flags, per-question review with explanation | 1 |
| US-06 | Retry only what I got wrong | Retry wrong ones starts a new session with exactly the wrong and skipped questions | 1 |
| US-07 | Learn 200 new words a day in the mode I choose | Vocab setup offers Flashcards, Choices, Fill the blank, Sentence equivalence; daily new-word cap defaults to 200 | 1 |
| US-08 | Mark words I struggle with so they come back | Know it / Unsure / Review on flashcards; star any word; due words surface by Leitner schedule | 1 |
| US-09 | Have every mistake collected in one place | Wrong quant answers and missed words appear in the mistake log automatically; Drill my mistakes builds a session from it; an item leaves after 2 correct answers in a row | 1 |
| US-10 | Know how many days are left and what to do today | Home shows days to Nov 24 and today's plan (due words, new words, quant target) with progress | 1 |
| US-11 | Keep practicing with no signal | After the first visit, all modes work offline, including results and mistake log | 1 |
| US-12 | Back up my progress | Export downloads one JSON file; import restores it on any device | 1 |
| US-13 | Share a session's result with a friend | Share on the results screen opens the phone share sheet with an image card and a text summary | 1 |
| US-14 | See whether I'm getting faster and more accurate | Dashboard shows 14-day accuracy and speed trends per topic and my 3 weakest topics | 2 |
| US-15 | Have difficulty adjust to me | Adaptive mode moves each topic up or down by the rule in Supporting features | 2 |
| US-16 | Share my recent history | Share on the dashboard sends a 7- or 14-day summary card | 2 |
| US-17 | Go through all words again after the first pass | After all 1,500 words are seen, the app offers Round 2, weakest first | 2 |
| US-18 | Search and browse the full word list | Browse with search by word or meaning, filter by tier, box or star | 2 |

## Scope and release phases

Phase 1 ships everything needed to study from day one, including the mistake log. Phase 2 adds depth during the first week of use, and Phase 3 is optional after that.

| Area | Phase 1: launch (target Nov 1–2) | Phase 2: first week (by Nov 7) | Phase 3: later (optional) |
| --- | --- | --- | --- |
| Quant drills | All 9 topics, 3 difficulty levels, typed / MCQ / Mix answers, per-set and untimed timers, results screen, retry wrong ones | Sprint mode, Adaptive difficulty, more templates for weak topics | Quantitative comparison and data-interpretation style questions |
| Vocab | Flashcard, MCQ, fill-the-blank and Sentence Equivalence modes, Leitner boxes, star, due/new/starred decks, 200 new words a day, first 600 words | All 1,500 words, Round 2, Browse and search, mnemonics for the hardest \~200 words | Audio pronunciation, verbal question types |
| Mistake log | Auto-collect wrong quant and missed words, Drill my mistakes, auto-clear after 2 correct | Filter by topic and age | — |
| Home and progress | Exam countdown, today's plan, streak, simple totals, today card, last session, one suggested drill | Full dashboard: 14-day trends, weakest topics, words per box; in-app study nudges; personal note for the second user | Score predictor |
| Share | Share a session result (image card + text) | Share 7- or 14-day history | Compare with a friend (needs a free backend) |
| Settings and data | Daily goals, exam date, timer and answer-mode defaults, theme, export/import, reset progress or everything | Per-topic defaults | — |
| Platforms | Web app + installable app on iPhone, Android and desktop (PWA), offline | Install prompt and app icon polish | Android APK (free, sideloaded); iOS App Store not planned ($99/yr) |

### Screens and navigation

&#91;embedded content: screens and navigation · Phase 1\]

Both practice flows run setup, session, results. Wrong answers from either results screen go to the mistake log without the user doing anything.

## Feature 1: Quant mental-math drills

Every question should be solvable in the head in under 60 seconds: pure calculation, or a one- or two-line word problem that wraps a calculation. No paper, no multi-step setup.

**Question formats**

- **Pure calculation:** "18% of 250 = ?", "3/8 as a decimal = ?", "√196 = ?"
- **Short word problem:** "A $240 jacket is 15% off. What is the sale price?" "A car covers 180 miles in 2.5 hours. Average speed in mph?"
- **Estimation:** "Closest to 49 × 51: 2,000 / 2,500 / 3,000 / 3,500 / 4,000"

**Answer modes: a mix of typed and multiple choice**

The GRE rewards smart guessing, so drills train both exact calculation and elimination.

- **Typed:** numeric keypad entry. Trains exact calculation.
- **Multiple choice:** five options (A–E). Wrong options are built from common mistakes (wrong base for a percent change, a dropped decimal place, adding instead of compounding), so a careless answer is always on the list. Trains estimating, eliminating and guessing well.
- **Mix (default):** about half typed and half multiple choice in each drill. Estimation questions are always multiple choice.

**Topics**

| Topic | Example skills |
| --- | --- |
| Arithmetic | Multi-digit × and ÷, squares, square roots, cubes |
| Fractions and decimals | Convert, compare, add, multiply |
| Percents | Percent of, percent change, successive changes, reverse percent |
| Ratios and proportions | Split a total by ratio, scale a recipe, part-to-whole |
| Averages | Mean, missing value for a target average, weighted average |
| Rates and work | Speed/distance/time, unit rates, combined work |
| Money | Discount, markup, profit, simple and compound interest (1–2 periods) |
| Exponents and powers | Powers of 2, 3, 5, 10; scientific notation |
| Estimation | Nearest answer, order of magnitude |

**Difficulty: three levels, defined by the numbers, not the concept**

- **Easy:** one awkward step (15% of 248, 7/12 of 156).
- **Medium:** two steps or uglier numbers (17.5% of 240; a 20% rise then a 15% fall; average speed over two legs).
- **Hard:** the top of GRE mental math, hard but not unreasonable (chained changes on awkward percents, mixed-number fractions, fractional and negative exponents).

*v0.5: each level moved up one step after the first content review ([0017](../decisions/0017-difficulty-up-one-level.md)).*

**Drill setup.** The user picks topics (one, several, or Mixed), difficulty (Easy, Medium, Hard, Adaptive), length (5 to 40 questions in steps of 5 on a swipe dial ([0022](../decisions/0022-question-count-dial.md)), or a 2/5/10-minute sprint), answer mode (Typed, Multiple choice, Mix) and timer mode.

**Timer modes**

- **Per set:** a countdown for the whole drill (default about 45 seconds per question).
- **Sprint:** fixed time, answer as many as possible.
- **Untimed:** the timer still runs silently so time per question is recorded.

**During a drill**

- One question per screen with a large numeric keypad (digits, decimal point, minus, fraction slash) and a Submit button. Enter submits on desktop.
- Answers accept equivalent forms: 0.5, .5 and 1/2 count as the same. Decimal answers state their rounding in the question ("to the nearest tenth").
- Skip is allowed and counts as wrong. No on-screen calculator, since calculation is the skill being trained.
- No right/wrong feedback during the drill. All results appear on the results screen at the end, as on the real test.

**Results screen**

- Score (correct / total), accuracy %, total time and average time per question.
- Breakdown by topic, by difficulty, and typed vs multiple choice.
- Flags: "slow but correct" (over 1.5× target time) and "fast but wrong" (likely careless).
- A question-by-question list: the user's answer, the correct answer, time taken, and a one-line shortcut explanation ("17.5% = 10% + 5% + 2.5%").
- Buttons: Retry wrong ones, New drill with same settings, Share. Wrong answers go to the mistake log automatically.

## Feature 2: Vocab flashcards

The deck holds the 1,500 most frequent GRE words. Each word has a meaning and one example sentence, and the user picks how to practice it: flashcards, multiple choice, fill the blank or Sentence Equivalence.

**Card contents**

- **Front:** the word and its part of speech.
- **Back:** a short meaning (one line, plain English), one example sentence that shows the word in context, and 2–3 synonyms.
- **Optional:** a short mnemonic for the hardest \~200 words.

**Flashcard mode**

1. The user sees the front and tries to recall the meaning.
2. Tap (or Space) to flip.
3. Mark the card: **Know it**, **Unsure**, or **Review**.
4. Next card. Swipe gestures on mobile, keyboard shortcuts on desktop.

**Multiple-choice mode**

- Three question types, mixed: pick the meaning of a word, pick the word for a meaning, or pick the word that fills the blank in its example sentence.
- Five options. Wrong options are other GRE words of the same part of speech, often near-synonyms or look-alikes, so guessing has to be smart.

**Sentence Equivalence mode** *(v0.7, replaces Type-in)*

- One sentence with a blank and six words. The user picks the two that give the sentence the same meaning.
- Only the exact pair scores, as on the exam. Words without a checked partner are asked another chosen way.

**Session results**

- Same rule as quant: no right/wrong during quiz cards. Results come at the end: score, time, words missed, and a Share button.
- A wrong answer in any mode sends the word back to box 1 and into the mistake log.

**Mark for review and spaced repetition**

- Every card sits in one of five Leitner boxes. Know it moves it up a box; Review sends it back to box 1; Unsure keeps it where it is.
- Box intervals: same session, 1 day, 3 days, 7 days, retired. The intervals are compressed because the study window is 3 weeks.
- A manual "Mark for review" star on any card, separate from the boxes, so the user can build their own hard-words list.

**Deck modes**

- **Due today:** cards whose review date has arrived (the default).
- **New words:** unseen cards, capped by a daily new-word goal (default 200).
- **Starred:** only manually marked words.
- **Browse:** search and scroll the full list.

**Rounds**

At 200 new words a day, the whole 1,500-word deck is seen within 8 days. Once every word has been seen, the app asks whether to start Round 2, which goes through all the words again with the weakest first: box 1 and starred words first, retired words last. Rounds repeat until the exam.

## Supporting features

Five small features turn two tools into a daily habit. The mistake log matters most.

**Name and encouragement** *(added in v0.5, [0019](../decisions/0019-personal-name-and-encouragement.md), [0020](../decisions/0020-name-only-encouragement.md))*

- On first open, the app asks for a first name, remembered on the device. All encouragement uses the name ([0020](../decisions/0020-name-only-encouragement.md)).
- Home greets the user by name with a short original motivational line; Results adds encouragement sized to the score. Never during a session.

**Home screen**

- Exam countdown to Nov 24 ("23 days to go") and today's plan: "Due words: 64 · New words: 200 · Quant: 100 questions."
- Streak counter and today's progress against the daily goals.
- One-tap Quick drill (20 mixed questions at the user's current level) and Continue vocab.
- *(v0.6, owner feedback: the Milestone A Home "seems blank".)* Home should feel like a study desk you open every day, not a launcher. Phase 1 adds, below the greeting: a **today** card (progress against both daily goals as pencil-tick rows), a **last session** line (score, time, date, tap to open its results), and one **suggested drill** card from the nudge rules below. Built as a desk layout with tally marks ([0032](../decisions/0032-home-desk-layout-tally-and-nudge-card.md)).

**Mistake log (Phase 1)**

- Every wrong or skipped quant question is saved with the user's answer, the correct answer and time taken.
- Every word marked Review or missed in a quiz is listed here too.
- A "Drill my mistakes" button builds a drill from the log, one for quant and one for words. A question leaves the log after it is answered correctly twice in a row.

**Progress dashboard (streak and totals in Phase 1; trends in Phase 2)**

- Quant: accuracy and average time per topic, trend over the last 14 days, weakest 3 topics highlighted.
- Vocab: words per box (new, learning, known, retired), words learned per day.
- Totals: questions answered, study days, current and best streak.

**Adaptive difficulty (Phase 2)**

In Adaptive mode, each topic's difficulty moves up after 8 of the last 10 answers are correct and under target time. It moves down after 5 or more of the last 10 are wrong.

**Share (session card in Phase 1; history card in Phase 2)**

Progress stays private on the device, but the user can choose to share it.

- A Share button on every results screen and on the dashboard.
- **Share a session:** a clean image card (score, accuracy, time, topics, date) plus a short text summary.
- **Share history:** a card with the last 7 or 14 days: questions answered, accuracy trend, words learned, streak.
- Uses the phone's own share sheet (WhatsApp, iMessage, email, and so on). On a laptop, it copies the text and downloads the image.
- No server involved and nothing is uploaded until the user picks where to send it.

**Settings**

- Daily goals (new words, quant questions), exam date, default timer per question, default answer mode, light/dark theme.
- **Export / import progress** as a JSON file. Since there is no login, this is the backup and the way to move progress from phone to laptop.
- Reset progress. A reminder to export appears every 3 days.
- *(v0.6)* **Reset**, two levels, at the bottom of Settings:
  - **Reset progress:** clears drills, answers, vocab boxes, stars, the mistake log and streaks. Keeps the name and settings.
  - **Reset everything:** also clears the name and settings and returns to the first-run name prompt, as on a fresh install.
  - Both offer "Export first" and ask the user to type `reset` to confirm. Nothing can be undone without an export file.

**Study nudges and reminders** *(added in v0.6, owner request)*

Nudges point the user at what to practise next, using their own results. They never show right/wrong feedback during a session.

- **In-app nudges (Phase 2; one card on Home in Phase 1):** computed on the device from recent results, shown on Home and at the end of Results. One nudge at a time, picked by priority:
  1. A paused drill: "You left a drill at 12 of 20. Pick it up?"
  2. A weak topic: lowest accuracy, under 90%, over the last 3 drills that included it, reaching further back until it has at least 10 answers: "Fractions was your weakest last time (58%). Do 20 more?" One tap starts that drill.
  3. Due words: "64 words are due today."
  4. A slow topic: at least half its correct answers flagged slow: "Percents: right but slow. Try a timed set."
  5. No study today by evening: "Nothing logged today yet. A 5-minute drill keeps the streak."
- **Push reminders (opt-in, [0037](../decisions/0037-push-reminders-with-on-device-text.md)):** the phone decides when to be woken from how the user is studying: at the usual study time if nothing is done yet, quiet once studied, one nudge 2 hours after pausing a session, a 9:30 pm warning when a streak of 2+ days would end, every third day after more than 3 days away, at most 2 a day and none after the exam. A small server receives only a push address and those times, sends an empty wake-up, and the phone writes the message from its own data.

**A personal note for the second user** *(added in v0.6, owner request, Phase 2)*

- If the first name entered matches one of the second user's names, Home and the nudges sometimes add a short note from Ashwyn, signed "Ashwyn says…": love and encouragement, never more than one per day, never during a session.
- The names are matched by a hash in the code, so they do not appear in this public repo. Anyone else sees the normal app.
- The notes are written or approved by Ashwyn before they ship.

## Rules and edge cases

These rules make scoring predictable and keep a session from being lost. All are Phase 1.

**Answer matching (quant)**

- Equivalent numbers are correct: 0.5 = .5 = 1/2 = 2/4; 1,200 = 1200; trailing zeros ignored.
- When the question says "nearest tenth" or "nearest whole number", only the rounded value is correct.
- Units and symbols ($, %, mph) are shown next to the input box and never need typing.
- Negative answers need the minus key. A blank answer counts as skipped.

**Answer matching (type-in vocab)**

- Not case-sensitive; leading and trailing spaces ignored.
- One wrong, missing or swapped letter counts as correct but is flagged "spelling slip" on the results screen.
- Accepted variants listed per word count as exact (e.g. "judgment" and "judgement").

**Multiple choice**

- Five distinct options, one correct, in random order. Quant options are formatted alike (all fractions, or all decimals).
- Guessing is free: a wrong answer scores zero, the same as a skip, so guessing is always worth it, as on the GRE.

**Timers**

- When a per-set timer runs out, unanswered questions are marked "not reached" and the results screen opens. They count as wrong in the score and are listed separately.
- Sprint mode ends at time-out; the score is the number correct.
- Per-question time is always recorded, including in untimed mode.

**Interrupted sessions**

- If the app is closed, the phone locks or the tab reloads mid-session, the session is saved after every answer.
- Reopening offers Resume or Discard. A timed session's clock pauses while the app is closed.
- Abandoned sessions older than 24 hours are discarded automatically and not counted in stats.

**Repeats and rounds**

- A quant question is not shown again within 7 days unless it is in the mistake log or a Retry wrong session.
- When the bank for a topic and difficulty runs out, the generator makes new questions with fresh numbers.
- Vocab: due reviews come before new words. The 200 new-word cap resets at local midnight.

**Days and streaks**

- A day counts toward the streak after at least one finished session. The day ends at local midnight.
- The exam countdown uses the exam date in Settings (default Nov 24, 2026) and hides itself after that date.

## Look and feel

Minimal and elegant, with quiet cues from a study desk: it should feel like a well-made notebook, not a game.

- **Palette:** warm paper off-white background, graphite text, one ink-blue accent; a deep charcoal dark mode for late-night study.
- **Type:** a refined serif for words and headings (the flashcard word is the hero), a clean sans-serif for UI and numbers, and tabular digits so timers and scores don't jitter.
- **Study cues, used sparingly:** a faint ruled-line or grid texture on cards, an index-card shape for flashcards, a pencil-mark tick for correct answers and a margin-note style for explanations.
- **Motion:** short, soft card flips and page turns; nothing bouncy. No sounds by default.
- **Layout:** big tap targets and a thumb-reachable keypad on mobile; generous white space; one task per screen.
- **Fractions and powers:** fractions are stacked and powers raised on screen, as in a textbook.

## Content strategy

The app ships with a fixed, owned bank of 1,500 quant questions and 1,500 words, all stored as JSON in the repo. A built-in generator adds fresh questions whenever the bank runs thin.

**Why 1,000 is not quite enough.** At 100–200 questions a day for 21 days, one user answers 2,100–4,200 questions. A fixed bank of 1,000 would repeat every 5–10 days. Hence two layers.

**Quant: two layers**

| Layer | Size | How it is made | Role |
| --- | --- | --- | --- |
| Curated bank (`questions.json`) | 1,500 questions | Claude writes \~80 templates and \~300 hand-written word problems, a script expands the templates, every answer is computed by code and spot-checked | The owned database: editable on GitHub, stable IDs, used first |
| Live generator | Unlimited | The same templates run in the app with fresh random numbers | Kicks in once a user has seen most of the bank for a topic and difficulty |

- Each question record: id, topic, difficulty, format, prompt, answer, accepted forms, target seconds, one-line explanation, source (template or hand-written).
- Repeats: the app tracks which IDs a user has seen and never repeats a question within 7 days unless it is in the mistake log.
- Internet questions are used for pattern inspiration only. Copying from RocketBlocks, ETS, Magoosh or prep books is out, since their question text is copyrighted.

**Vocab: 1,500 words**

- **Word list:** individual words are not copyrighted, so the list is built from the public high-frequency lists (Barron's, Magoosh, Manhattan, ETS-official practice material, community lists). Words that appear on the most lists rank highest, and the top 1,500 make the deck.
- **Meanings, sentences, synonyms and mnemonics:** written fresh by Claude. A specific book's definitions and example sentences are copyrighted text, so those are not copied.
- **Tiers:** each word is tagged Tier 1 (top 500, most frequent), Tier 2 (next 500) or Tier 3 (last 500). New-word order follows tiers so the highest-yield words come first.
- **Quality check:** a script flags duplicates, missing fields and sentences that do not contain the word; a manual pass on a random 10% sample before launch.

**Ownership.** Both JSON files live in the repo. Ashwyn can fix or add an item by editing the file on GitHub; the site redeploys automatically.

**Data the app records (on the device only)**

Five kinds of records power every stat, the mistake log, export and sharing. Exact schemas belong in the TRD.

| Record | Key fields | Used for |
| --- | --- | --- |
| Session | id, type (quant / vocab), mode, settings, start and end time, score, status (finished, abandoned) | Results screen, history, streak, share cards |
| Quant attempt | session id, question id, topic, difficulty, answer mode, user answer, correct?, seconds taken, flags (slow, careless, not reached) | Breakdown by topic and difficulty, trends, mistake log |
| Word state | word id, Leitner box, next due date, times seen, times correct, starred, last result, round | Due deck, Round 2 order, words-per-box stats |
| Word attempt | session id, word id, mode, user answer, correct?, spelling slip?, seconds | Vocab results, mistake log, accuracy trend |
| Mistake log item | item id (question or word), added date, correct-in-a-row count | Mistake log and Drill my mistakes |

Settings (goals, exam date, defaults, theme) are stored alongside. One export file holds all of the above.

## Platform, hosting and data

One codebase, served free from GitHub Pages at `ashwynkmr.github.io/graphite`, installable on phone and laptop. Total cost: $0.

| Requirement | Decision |
| --- | --- |
| Platforms | One codebase, two ways in. Web: open the URL in any browser. App: install it from the browser ("Add to Home Screen" on iPhone, "Install app" on Android and desktop Chrome/Edge); it then opens full-screen from its own icon, works offline and looks like a native app. An Android APK is a Phase 3 option |
| Hosting | GitHub Pages from a separate public repo `graphite`, auto-deployed on every push |
| Offline | Full app and both content files cached on first load; drills and flashcards work with no signal |
| Accounts | None. No login, no server, no database service |
| User data | Stored in the browser on each device (IndexedDB). Each person and each device has separate progress |
| Backup | Export/import progress as a JSON file from Settings |
| Sharing | Send the link. The second user needs nothing else. Stats are shared through the phone's share sheet, with no backend |
| Performance | First load under 2 seconds on 4G; answer-to-next-question under 100 ms |
| Layout | Mobile-first, one-handed keypad; comfortable at desktop widths with keyboard shortcuts |

**Cost check**

- GitHub Pages for a public repo on a free account: free.
- Custom domain: optional, about $12 a year. Not needed.
- App stores: not used, so no $99 Apple or $25 Google fee.

**Constraints and risks**

- The repo must stay public for free Pages hosting, so the question and word files are publicly visible. Fine for original content.
- Browser storage can be cleared by the user or, rarely, by iOS Safari after weeks of not opening the app. Export/import is the safeguard; installing to the home screen reduces the risk.

## Non-functional requirements

| Area | Requirement |
| --- | --- |
| Speed | First load under 2 s on 4G; later loads under 1 s from cache; next question under 100 ms after an answer |
| Offline | Every Phase 1 feature works offline after the first visit; content updates download in the background on the next online visit |
| Size | Total download under 3 MB, including both content files |
| Devices | iPhone (iOS 16+, Safari), Android (Chrome, last 2 versions), desktop Chrome, Edge, Safari and Firefox (last 2 versions) |
| Screen sizes | 360 px phone to 1440 px desktop; keypad reachable with one thumb on phones |
| Accessibility | Text contrast at least 4.5:1 in both themes; respects system font size; all actions reachable by keyboard; MCQ options and timer read correctly by screen readers |
| Reliability | Progress saved after every answer; no data loss on reload, app switch or phone lock |
| Privacy | No accounts, no analytics, no tracking, no ads; results leave the device only if the user shares or exports them. Opt-in reminders send a push address and wake-up times only |
| Content integrity | 100% of template answers computed by code; automated checks on every content change before deploy |
| Cost | $0 to run: no paid services; the optional reminder server targets a free hosting plan |

## Success metrics

The app succeeds if, by the exam on Nov 24, both users are faster and more accurate at mental math and know most of the 1,500 words.

| Metric | Target by Nov 24 |
| --- | --- |
| Quant accuracy (Medium) | 90% or higher |
| Average time per question (Medium) | Down 30% from week 1 |
| Words in Known or Retired boxes | 1,200 of 1,500 |
| Vocab quiz-card accuracy | 85% or higher |
| Repeat rate | No question seen twice in 7 days outside the mistake log |
| Days used | 20 of the days between start and exam |
| Answer-key errors reported | Fewer than 5 |

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Launch slips past Nov 2 | Lost study days before Nov 24 | Phase 1 is fixed and small; Phase 2 ships in pieces during the first week |
| Wrong answer keys | Users stop trusting the app | Answers computed by code; automated checks; "Report a problem" link on every question that opens a prefilled GitHub issue |
| Vocab content not ready in time | New-word queue runs dry | Launch with 600 words (3 days of new words); add 300+ words a day until all 1,500 are in |
| Questions feel repetitive | Practice loses value | 1,500-question bank, 7-day no-repeat rule, live generator for fresh numbers |
| Browser storage cleared (mostly iOS Safari) | Progress lost | Install to home screen; Export reminder every 3 days |
| Distractors too easy or ambiguous | MCQ trains nothing | Distractors built from common mistakes; checks for duplicates and for two options being equal |
| Copyright on word content | Takedown request | Only the word list is sourced; all meanings, sentences and mnemonics are original |

## Milestones

&#91;embedded content: milestones · 5 phases, 4 gates\]

Use starts Nov 1 or soon after, and the exam is Nov 24, so phases 2–4 need to fit into about two days. To make that work, the TRD and content run in parallel, and v1 can launch with the full quant bank and the first 600 words. That covers the first 3 days at 200 new words a day, while the remaining 900 words are added in batches.

## Decisions

Decided on Oct 31. Phase 1 includes the mistake log and every core feature; the rest follows in Phases 2–3. The web version and installable app ship together from one codebase. The app is named Graphite.

| Question | Decision |
| --- | --- |
| Start date | Nov 1, or a little later |
| Exam date | Nov 24, 2026; home screen counts down to it |
| Answer input | Mix of typed and multiple choice, to train guessing as well as calculation |
| Feedback timing | Results only at the end of a session, never after each question |
| New words per day | 200; deck stops at the 1,500 most frequent words, then offers Round 2 |
| Vocab practice | User picks any mix of flashcards, multiple choice, fill the blank and Sentence Equivalence for each session |
| Comparing scores | No shared backend; progress stays private, and a Share button sends session stats or history |
| Repo and URL | `Repo graphite at ashwynkmr.github.io/graphite` |
| Look and feel | Minimal and elegant, with subtle study-desk design cues |

- [ ] **App name:** Graphite, decided Oct 31.
