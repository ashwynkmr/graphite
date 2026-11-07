# Changelog

User-facing changes, newest first. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow the milestones (`v0.1.0` quant live, `v0.2.0` vocab live, `v1.0.0` Phase 1 complete, `v2.0.0` Phase 2 complete).

## [Unreleased]

### Added
- Vocab difficulty: Easy, Medium, Hard or Adaptive for Choices, Fill the blank and Sentence equivalence. Hard asks "Closest in meaning?" and uses exam-style sentences with trap words; Adaptive asks each word by how well you know it. Flashcards are unchanged.
- Vocab results show "By difficulty", and the vocab share card lists quiz cards by difficulty.
- A What's New screen for the updates since `v3.0.0`.
- A one-time screen offering reminders, and a card at the top of Home while they're off. On iPhone in Safari, both show how to add Graphite to the Home Screen first.

## 2026-11-05 · Progress report card (after `v3.0.0`)

### Changed
- The Progress share is now a report card: the GRE countdown and days studied on top, then Quant and Verbal side by side, with a short note worked out from the numbers. The copied text follows the same split.

## 2026-11-04 · Share cards and results (after `v3.0.0`)

### Changed
- Share cards show each row as a ruler, with the count and percentage in numbers, in place of the row of slashes.
- The results screen uses the same rulers, in place of plain bars.
- Quant share cards and the results screen's "By topic" list run from weakest to strongest.

### Fixed
- Quant share cards left out topics after the first 4, so the rows didn't add up to the score. Every topic now gets a row, up to 7, then "Other topics".

## [3.0.0] - 2026-11-01 · Phase 3

### Added
- The question bank grows from 1,500 to 3,215, and every question you've seen keeps its place in your progress.
- Five new subjects: algebra, geometry, number properties, statistics and probability.
- A Comparison topic of 239 questions, Quantity A against Quantity B, in the exam's format and order.
- 294 harder, exam-style Sentence Equivalence sentences with decoy pairs, used first for the 582 words they test.
- Results show the sentence after a Sentence Equivalence question from the new set.
- A quick tour for first-time users, also in Settings.
- A new What's New screen for this release.

### Changed
- 231 questions have a clearer explanation on Results.
- Long questions fit one screen, with Submit always in view.
- On short screens, Sentence Equivalence options sit in two columns.

## [2.0.0] - 2026-11-01 · Phase 2

### Added
- A one-time What's New screen after updating, and a What's New entry in Settings.
- Sprint: 30 seconds to 15 minutes on a dial, answering as many questions as you can.
- Adaptive difficulty: each topic moves up or down with your results, and Results tell you when one does.
- Picking one topic brings back the setup you last used for it.
- Browse and search all 1,500 words by word, synonym or meaning, and filter by frequency, stage or star.
- Round 2: once you've seen every word, go through them all again, weakest first.
- Memory aids for 231 of the hardest words, on the flashcard's back and in Browse.
- Progress: 14-day accuracy and speed trends for all topics or one, your weakest topics, each topic's level, words per stage and new words a day.
- Share a 7- or 14-day summary of your studying from Progress.
- A suggestion of what to do next on the results screen: a paused session, a weak topic, words due or a slow topic.
- Filter the mistake log by topic, or by how a word was missed. Drill my mistakes follows the filter.

### Changed
- When time runs out on a timed set or sprint, an option you've picked counts as your answer.
- A word is bold in its example sentence on flashcards and in Browse.

## [1.0.0] - 2026-11-01 · Milestone C: Phase 1 complete

### Added
- Home shows your streak, today's progress as tally marks, one suggestion from your own results, your last session and a backup reminder, with Quick drill and Continue vocab side by side.
- Mistake log: every wrong or skipped question and missed word, with Drill my mistakes for quant and for words.
- Progress: current and best streak, plus totals for quant, vocab and study days.
- Settings: daily goals, exam date, drill defaults, theme, install, export and import.
- Share a session from the results screen: an image card and a short text summary through your phone's share sheet, or copied and saved on a laptop.
- Optional reminders that follow how you study, sent as phone notifications. Turn them on in Settings.
- Personal notes from Ashwyn for the second user, with one question each night about whether to keep them coming.
- 300 new word problems across all nine topics, written fresh and worked out by code, taking the bank to 1,500 questions.
- Report a problem under each question and word on Results and in the Mistake log.
- Reset progress or Reset everything, each offering an export first and asking you to type `reset`.

### Changed
- Fractions are stacked, one number above the other, and powers are raised, so 1 1/4 can't be misread as 11/4.
- The app's name now appears on screen as gRAPHITE: a large lowercase g followed by small capitals.

## [0.2.0] - 2026-11-01 · Milestone B: vocab live

### Added
- Vocab practice with all 1,500 GRE words, each with an original meaning, example sentence, synonyms and look-alike words.
- Choose Today (due plus new words), New or Starred, and 25 to 400 cards on a dial.
- Mix practice types in one session: flashcards, multiple choice, fill the blank and Sentence Equivalence.
- Sentence Equivalence: pick the two of six words that give a sentence the same meaning, from 661 hand-checked pairs.
- Flashcards: tap to flip, then swipe right (Know it), left (Review) or up (Unsure), or tap the round marks; star a word from the card's corner.
- Vocab results with a score for quiz cards, a tally of flashcard marks, and words grouped as Missed, Unsure and Got right; words come back on a Leitner schedule.
- Redo the missed words as flashcards from the results screen, round after round, until every word is right.

### Changed
- Quant setup: choose the number of questions on a swipe dial, from 5 to 40 in steps of 5 (was 10, 20 or 30).
- New versions now show a full-screen update page instead of a small bar. It waits until any active session ends or is paused.
- Ending a session or drill early now asks on the page, and End moved to the top right in vocab sessions.

### Removed
- Type-in practice. Sessions started before this release still open.

## [0.1.0] - 2026-10-31 · Milestone A: quant drills live

### Added
- Installable app shell at https://ashwynkmr.github.io/graphite/ with five tabs (Home, Quant, Vocab, Mistakes, Progress) and Settings.
- Exam countdown on Home (days to Nov 24, 2026).
- Light and dark themes that follow the system setting.
- Works offline after the first visit.
- 1,200 mental-math questions across 9 topics and 3 levels; every answer computed by code.
- Quant drills: pick topics (or "Mixed: give me anything"), one or more difficulty levels, length, answer mode and timer; Quick drill from Home.
- Drill screen with a numeric keypad or five choices; no right/wrong until the end; pause, resume after a reload, timed sets.
- Results with score, timings, breakdowns, slow/careless flags, a review of every question with a shortcut, and Retry wrong ones.
- Asks for your name on first open and cheers you on by name on Home and Results.
- "Update available" bar on every tab screen (never during a drill).
- App icon: a serif lowercase g with a fountain pen on a notebook page.
