# 0007. Results only at the end of a session
2026-10-31 · Accepted · Planning · Product

## Context
Most drill apps flash right or wrong after each answer. The GRE doesn't: you move on without knowing, and managing that uncertainty is part of the test. The question was whether Graphite should copy common practice or test conditions.

## Options
- **Feedback after every question:** fast in-the-moment learning, and builds a habit the exam won't support.
- **Results only at the end:** mirrors the exam; learning happens on the review screen.
- **User toggle:** flexible, but adds a setting and weakens the default.

## Decision
No right/wrong feedback during any session, in quant or vocab (multiple choice and type-in). The results screen shows score, timing, breakdowns, slow/careless flags and a question-by-question review with a one-line explanation. Every miss goes to the mistake log automatically. Flashcards are the one exception by nature: the user flips the card and grades themselves.

## Trade-offs
Slower in-the-moment learning: a user can repeat the same mistake several times in one drill before seeing it. The review screen, Retry wrong ones and the mistake log are there to close that loop. It's also a strict rule for the build: no colour, sound or animation may hint at correctness mid-session.

## Signals to revisit
- Users skip the review screen, which would mean the learning loop isn't working.
- The same mistake pattern repeats across sessions without improvement.
