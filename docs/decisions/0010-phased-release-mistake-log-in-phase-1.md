# 0010. Phased release, with the mistake log in Phase 1
2026-10-31 · Accepted · Planning · Scope

## Context
Study starts Nov 1 and the exam is Nov 24. Building everything before anyone studies would waste days. Ashwyn asked for the important features up front and the rest later, so the question was where to draw the Phase 1 line.

## Options
- **Ship everything at once:** complete, but it launches days late.
- **Ship only drills and flashcards first:** fastest, but no way to review mistakes until later.
- **Phase 1 = everything needed to study daily, including the mistake log; Phase 2 adds depth in week one; Phase 3 optional.**

## Decision
Three phases. **Phase 1 (Nov 1–2):** all 9 quant topics and 3 difficulties, typed/MCQ/Mix, results and retry, vocab in three modes with Leitner boxes and the first 600 words, the mistake log, Home with countdown and plan, basic progress, session Share, settings and export. **Phase 2 (by Nov 7):** Sprint and Adaptive modes, all 1,500 words, Round 2, Browse, the trends dashboard, history Share. **Phase 3:** optional extras.

The mistake log made Phase 1 because it's the highest-value learning loop: results arrive only at the end ([0007](0007-results-only-at-end.md)), so the log is where misses turn into practice.

## Trade-offs
Phase 1 users get no trends dashboard, no Adaptive difficulty and no Sprint mode in the first days. Phase 2 has to land during the first week while both users are already studying, so it ships in small pieces.

## Signals to revisit
- Phase 1 slips past Nov 2.
- Users ask for a Phase 2 feature in the first days more than they use a Phase 1 one.
