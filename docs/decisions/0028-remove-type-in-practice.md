# 0028. Remove Type-in from vocab practice
2026-11-01 · Accepted · Phase 1 · Product

## Context
Vocab offered four practice types ([0025](0025-swipe-flashcards-and-mixed-practice.md)). At Checkpoint B2, Ashwyn asked for Type-in to go: "I don't see the point of that." The GRE never asks a test-taker to spell a word from its meaning, so the mode trained a skill the exam doesn't test.

## Options
- Keep it, but hide it behind a setting.
- Remove it from setup, keeping only what old data needs.
- Delete it entirely, including the session screen and grading.

## Decision
Remove it from setup. A saved Type-in choice becomes the remaining choices, or Flashcards if it was the only one. Starting a session from old results drops it too.

The session screen and grading stay, so a session started before this release still opens and old results still read correctly. `word-answer.ts` stays for the same reason.

## Trade-offs
- A small amount of code remains that new sessions can't reach. Deleting it would break any unfinished Type-in session on a phone.
- The PRD's Phase 2 hint toggle no longer has a purpose and is dropped.
- Spelling is no longer practiced anywhere. The exam's vocabulary questions are all selected, not typed.

## Signals to revisit
- Old sessions have aged out: delete the remaining code.
- Ashwyn finds recognition isn't turning into recall, and wants a recall mode back.
