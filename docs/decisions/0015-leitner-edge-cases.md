# 0015. Leitner edge cases: same-session repeats only for misses
2026-10-31 · Accepted · Phase 1 · Product

## Context
The TRD says box 1 cards come back "at the end of the same session, then tomorrow", and that Unsure keeps a card in its box. Two cases are left open. First, a new word marked Know it moves from box 0 to box 1: should it repeat in the same session? Second, a new word marked Unsure would "stay" in box 0, which means it still counts as unseen. At 200 new words a day, both choices change the daily load a lot.

## Options
- **Literal reading:** every card landing in box 1 repeats in-session, and Unsure on a new word leaves it in box 0. That doubles a new-word session (200 new words become about 400 cards), and Unsure words get pulled in as "new" again, counting twice against the daily cap.
- **Repeat only on a miss:** Review or a wrong answer sends the card to box 1 and back into the current session. Know it and Unsure on a new word move it to box 1, due tomorrow, with no in-session repeat.

## Decision
Repeat only on a miss. Concretely:
- Know it, a correct answer or a spelling slip: box + 1.
- Review or a wrong answer: box 1, repeated at the end of this session, then due tomorrow.
- Unsure: same box, due tomorrow. A new word goes to box 1, so it counts as seen.
- Retired (box 5) cards stay retired unless missed.

## Trade-offs
A new word the user claims to know isn't checked again until tomorrow, so an over-confident Know it costs one day. That's acceptable: the next day's review catches it, and a miss then drops it to box 1. In return, the 200-a-day plan stays at about four 50-card sessions instead of eight.

## Signals to revisit
- Many words fall from box 2 back to box 1 the day after being marked Know it.
- Users say a session feels too short to learn new words.
