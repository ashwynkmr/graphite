# 0017. Raise every difficulty by one level; Hard reaches the GRE's hardest
2026-10-31 · Accepted · Phase 1 · Content

## Context
The PRD defined Easy as friendly numbers (20% of 80), Medium as one awkward step and Hard as two steps or uglier numbers. Reviewing the first 30 generated questions, Ashwyn found Easy too gentle to be worth study time ("10 is what percent of 20?"). The ask: Easy should be what was Medium, Medium what was Hard, and Hard "extra hard but not unreasonable", with the GRE's hardest as the ceiling (FB-07).

## Options
- **Keep the levels and steer users to Medium and Hard:** no work, but wastes a third of the bank and the Easy default.
- **Relabel only (Medium → Easy, Hard → Medium) and drop old Easy:** quick, but leaves nothing above old Hard.
- **Shift every template up one level and write a new top tier:** more work; the full range moves up.

## Decision
Shift and extend. Every template now takes a level 2–4 internally: Easy draws from the old Medium pools, Medium from the old Hard pools, and Hard from new pools at the top of GRE mental math (two-step chains, awkward percents like 17.5% and 62.5% inside word problems, harder fractions and exponents). The mental-math guard allows up to 5 significant digits at Hard. Hard stays solvable in the head in about 60–90 seconds: no long multi-step problems, consistent with [0001](0001-mental-math-drills-not-full-gre-quant.md).

## Trade-offs
- No truly gentle warm-up level, which matters less for a 3-week sprint by two motivated users.
- Rewriting the top tier of 73 templates costs build time before drills go live.
- The bank is regenerated, so question IDs change. That's harmless now because nobody has progress yet.

## Signals to revisit
- Medium accuracy sits well below the 90% target after the first week, which would mean the jump is too big.
- Hard questions regularly take over 2 minutes.
