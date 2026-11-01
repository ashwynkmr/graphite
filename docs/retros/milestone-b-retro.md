# Retro: Milestone B (vocab live)
2026-11-01 · `v0.2.0` · Steps 6–8

## Goal versus what shipped
**Goal:** a ranked word list, original entries for ranks 1–600, and a vocab flow with spaced repetition.

**Shipped on Nov 1:**
- a list of 1,500 words ranked by agreement across public lists
- original entries for all 1,500 (the plan was 600)
- swipe flashcards, multiple choice, fill the blank and mixed sessions
- Sentence Equivalence, with 661 hand-checked pairs (not in the plan)
- results grouped by Missed, Unsure and Got right, with a redo round
- a full-screen update page

**Removed along the way:** Type-in, which was in the plan but tests a skill the exam doesn't.

## What went well
- **Screens before content.** Building the flow with 100 words ([0024](../decisions/0024-vocab-screens-before-all-600-words.md)) got review feedback before the writing started.
- **The validator replaced sample reviews.** Every batch passed `validate-words.ts` before commit ([0026](../decisions/0026-write-all-1500-entries-before-launch.md)), and Ashwyn wasn't asked to read samples.
- **Testing a real update.** Changing the built service worker tested the update page against a real update, in a clean browser, including resuming a session.

## What was hard
- **A phone bug I couldn't reproduce.** End session failed on Ashwyn's phone and worked in desktop Chromium. I changed both likely causes, and Ashwyn confirmed the fix, but the exact cause is still unknown.
- **Automated browsers aren't phones.** The six-option screen pushed End session below the fold, and my first layout check used a full 812 px screen, so it looked fine. I should have tested at the height left once browser toolbars are showing.
- **Literal reading of "whenever".** I built the update page to interrupt sessions and flagged it. Ashwyn rejected that after seeing it. It cost one staging round, and the flag made it a quick call.
- **Synonyms aren't interchangeable.** Only 661 of 764 candidates fit their sentence. Reading them also showed lucid/pellucid gave the answer away by spelling.

## What I'd do differently
- Check every screen at about 664 px tall, not only 812.
- Use page-drawn dialogs from the start. Native dialogs can't be styled and may be refused.
- Agree scope on new question types before building. Sentence Equivalence is easier than the exam, and that wasn't discussed first.

## Next bets (Milestone C)
- The mistake log screen, with "Drill my mistakes".
- Progress, a two-level reset, and a fuller Home.
- Verify install and offline on a real phone against the live site, still open from Milestone A.
