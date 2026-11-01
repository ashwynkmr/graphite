# 0018. Wrong options must include real mistakes, not only near misses
2026-10-31 · Accepted · Phase 1 · Content

## Context
Multiple choice exists to train smart guessing ([0006](0006-typed-and-multiple-choice-mix.md)). The generator fills four wrong options with named mistakes first, then tops up with near values (answer ± a step, ±10%). Some questions ended up with only one named mistake, plus options so far out of range that they rule themselves out (100,000,000 beside 1,000,000). Ashwyn asked that not every wrong option be a giveaway: some must be answers people actually give (FB-08).

## Options
- **Leave as is:** some questions train nothing beyond spotting the odd one out.
- **Only named mistakes, no near values:** realistic, but many templates can't produce four distinct ones.
- **At least two named mistakes per question, near values only as filler, and a plausibility band.**

## Decision
Every multiple-choice question that isn't an estimation question must keep at least two named-mistake options (wrong base, adding instead of chaining, inverted ratio, decimal slip, off-by-one count, and so on). Options more than 12× larger or smaller than the answer are dropped, except the deliberate ×10 and ÷10 decimal slips. Near values only fill what's left. The property test enforces the two-named-mistake floor for every template.

## Trade-offs
Some draws are now rejected for lack of good distractors, so templates need richer mistake lists. Estimation keeps evenly spaced options on purpose ([0006](0006-typed-and-multiple-choice-mix.md)).

## Signals to revisit
- MCQ accuracy runs far above typed accuracy on the same topics, which would mean options are still too easy to eliminate.
