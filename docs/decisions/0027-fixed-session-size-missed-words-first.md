# 0027. Fixed session size, missed words first, and a redo round
2026-11-01 · Accepted · Phase 1 · Product

## Context
[0024](0024-vocab-screens-before-all-600-words.md) brought a flashcard marked Review back once at the end of the session. On staging, Ashwyn found the card count kept growing as words were marked wrong: "If I select a set of 25 words, it should be just 25 words." He also asked for wrong answers to come first on the results screen, "so that there's a second learning opportunity", and for a redo button that repeats the wrong words as flashcards until all are right.

## Options
- Keep the requeue but show it as "25 + 3 again", or drop it.
- Results: one list with misses on top, or labeled groups.

## Decision
No requeue: a session has exactly the number of cards chosen. Results group the words under Missed, Unsure and Got right, in that order, each with a count.

When any word is missed or unsure, the main button on results is "Redo these N words" (shortened after FB-51). It starts a new, shuffled flashcard session with just those words, and that session's results offer it again until none are left. The saved settings are unchanged.

## Trade-offs
- A missed flashcard isn't seen again the same day unless the user starts another session. The Leitner schedule brings it back tomorrow.
- Old sessions that already have requeued cards still display correctly.
- Redo marks count toward the schedule like any other, so a word missed and then known on redo ends the day in box 2, not box 1.

## Signals to revisit
- If redo rounds move words up the boxes too quickly, make redo marks practice-only.
