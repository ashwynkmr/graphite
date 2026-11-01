# 0014. Ship a usable quant drill before the hand-written word problems
2026-10-31 · Accepted · Phase 1 · Scope

## Context
The TRD's build plan puts the ~300 hand-written word problems at step 4, before the data layer and the quant flow. That means no one can drill until all content is done. Study starts Nov 1, and every day without a usable drill is a lost study day.

## Options
- **Follow the TRD order:** the bank reaches 1,500 before anyone drills; the first drill lands later.
- **Ship the drill on the ~1,200 template questions first; add hand-written problems in Milestone C:** usable drills on day one.
- **Skip hand-written problems entirely:** fastest, but loses the most natural-sounding word problems.

## Decision
Reorder the build into three milestones: **A** quant drills live (scaffold, engine, generated bank, data layer, quant flow), **B** vocab live, **C** the rest of Phase 1, which includes the hand-written problems (step 10). The bank launches at about 1,200 questions and grows to about 1,500 in Milestone C.

## Trade-offs
For the first day or two the bank is about 1,200 questions, all template-generated, so word problems lean on template scenarios and can feel more mechanical. At 100–200 questions a day that's still 6+ days before the 7-day no-repeat rule bites, and the live generator covers any gap ([0003](0003-1500-question-bank.md)).

## Signals to revisit
- Template wording feels repetitive in the first sessions, which would pull the hand-written problems forward.
- Milestone C slips, leaving the bank at 1,200 for longer.
