# 0047. Study nudges sit under the Results buttons
2026-11-01 · Accepted · Phase 2 · Product

## Context
Home already shows one suggestion picked from the user's own results. The PRD adds the same suggestion "at the end of Results". A drill's review list can run to 40 questions, so the literal end of the page may never be seen.

## Options
- At the very bottom, under the review list: matches the PRD's words, often unseen.
- Under the buttons, above the breakdown: seen without scrolling, on the way to the review.
- A pop-up on arrival: impossible to miss, but it interrupts reading the score.

## Decision
Under the buttons, as one line with one button. The order is the PRD's: a paused session first, then a weak topic, words due, a slow topic. It uses the same rules as Home, computed after the session is saved, so it can name the drill just finished. It's never shown during a session, so no verdict appears before results (0007).

No new rule was added, so the "no study by evening" prompt can't appear here: the user has just studied.

## Trade-offs
- Results gets one more thing above the review.
- A word-only session can suggest a quant topic, which may feel off-topic.
- The suggestion can repeat what Retry already offers, when the weak topic is the one just drilled.

## Signals to revisit
- Ashwyn finds it crowds the results screen.
- The two users rarely tap it, once there's real use to look at.
