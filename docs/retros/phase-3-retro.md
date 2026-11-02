# Retro: Phase 3 (the question bank and a quick tour)
2026-11-01 · `v3.0.0` · Four checkpoints on one branch

## Goal versus what shipped
**Goal:** a better question bank and a short first-time tutorial, nothing else ([0049](../decisions/0049-phase-3-is-the-question-bank-and-a-tour.md)), with one launch a few days after finishing.

**Shipped on Nov 1, all at once:**
- a bank of 3,215 questions, up from 1,500, with five new subjects and a 239-question Comparison topic
- 231 clearer explanations, and Submit always in view on long questions
- 294 exam-style Sentence Equivalence sentences with decoy pairs, where about 300 were planned
- a quick tour, and a new What's New at Ashwyn's request

**Changed:** Ashwyn asked to launch on finishing rather than a few days later (FB-119).

**Dropped on purpose:** audio, score predictor, compare with a friend and the Android APK. Data-interpretation questions weren't chosen.

## What went well
- **Live IDs held.** All 1,500 live questions kept their IDs, answers and options through every rebuild, so saved progress stayed valid. Comparing each rebuild with `main` made this a check rather than a hope.
- **Reading caught what tests can't.** Reading samples found trivial fractions like 12/12. Rereading the sentences found seven whose decoys could arguably fit, such as "plethora" in "Not a(n) ____ of proof".
- **A browser test earned its place.** The longest sentence pushed Submit 52 px off a 664 px screen, which led to two-column options on short screens.
- **Testing a real update.** The `v2.0.0` build, with saved words, mistakes and a paused drill, was updated to the new one. No data was lost.

## What was hard
- **Drafting from memory.** About a third of the first sentence drafts used words outside the deck, mostly verbs and nouns. Checking against the deck should have come first.
- **Fewer sentences than planned.** About 30 drafts were cut as unfair or lacking a deck word, leaving 294.
- **125 right pairs rest on reading.** The deck doesn't list them as synonyms, so no test backs them up.
- **A false alarm.** An update test showed only 15 of 50 questions using the new sentences, because the script had left another practice type on. Measured properly, a Sentence-Equivalence-only first pass uses them about 68% of the time.
- **Mistakes in my own tests.** Three checks failed on how they looked for buttons or waited for the screen, not on the app.

## What isn't known
- The harder sentences and two-column options went live without phone feedback: the 20 samples were approved in chat, but the full set wasn't reported on.
- Whether "Hard" matches the real exam. It's a label, not a measurement.
- Android: reminders, notes and the install button are still untested.

## What I'd do differently
- Give writers the allowed word list before drafting, not after.
- Ask for the phone review as a single, short step at the launch request, so it isn't skipped.
- Build a small preview of long-sentence screens earlier in a checkpoint.
