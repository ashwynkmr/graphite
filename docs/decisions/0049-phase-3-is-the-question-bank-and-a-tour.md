# 0049. Phase 3 is the question bank and a quick tour, launched once
2026-11-01 · Accepted · Phase 3 · Scope

## Context
The roadmap listed five optional items for Phase 3. Given a comparison of value before the exam, effort and risk, Ashwyn chose none of them as listed (FB-110): only a larger, better question bank, plus a minimal tour for first-time users (FB-111). A second user is studying on the live app, so Ashwyn wants it left alone until the phase is finished, then launched a few days later (FB-112).

## Options
- Build the roadmap as listed: most of it adds little before an exam, and compare with a friend breaks the rule that progress stays on the device.
- Launch each piece as it's approved: new questions arrive sooner, with more updates during study.
- One launch once the phase is finished: a steady app, with new questions arriving later.

## Decision
Scope: new quant subjects, better explanations, Quantitative Comparison, a harder Sentence Equivalence bank and the tour. Audio, the score predictor, compare with a friend and the Android APK are dropped. One launch, a few days after the phase is finished. The way of working in [0042](0042-phase-2-on-a-branch-commit-as-we-go.md) carries over on a `phase-3` branch.

## Trade-offs
- New questions reach study later, and the launch date runs close to the Nov 24 exam if the phase runs long. The date is Ashwyn's to set.
- Android checks stay untested until someone has an Android phone.

## Signals to revisit
- The launch would land in the final days before the exam.
- Real results show a topic needs more than the plan gives it.
