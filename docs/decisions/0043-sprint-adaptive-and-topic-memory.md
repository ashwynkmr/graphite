# 0043. How Sprint, Adaptive and per-topic defaults work
2026-11-01 · Accepted · Phase 2 · Product

## Context
The PRD leaves gaps. Sprint questions go unreached. The Adaptive rule would let one good drill count twice. "Per-topic defaults" doesn't say what is set or where.

## Options
- **Sprint's unreached questions:** log them as not reached, like a timed set, or drop them.
- **Adaptive's evidence:** all of a topic's recent answers, or only those from Adaptive drills since the last move.
- **Topic defaults:** a Settings page with nine rows of options, or remembering what was last used.

## Decision
- **Sprint:** 2, 5 or 10 minutes, lining up 25 questions a minute. Results count only what was answered, so unreached questions never reach the mistake log. At time-up, a picked option counts as answered (FB-96), in timed sets too; a half-typed number doesn't. Retries, mistake drills, Quick drill and suggestions are never sprints.
- **Adaptive:** picked in place of a level. Topics start at Medium. A topic moves up after 8 of its last 10 are correct and under target, and down after 5 or more wrong. Only drills played on Adaptive count, and counting restarts after a move, so one good drill can't jump two levels. Results show moves.
- **Topic defaults:** picking one topic alone brings back the setup last used for it. No new page.

## Trade-offs
- A sprint's accuracy looks high when few questions were answered; the count sits beside it.
- With Mixed, each topic gets about two questions a drill, so moves take several drills.
- Remembered setups can surprise people.

## Signals to revisit
- Levels feel too slow or too jumpy in real study.
- Ashwyn wants to see or set each topic's level.
