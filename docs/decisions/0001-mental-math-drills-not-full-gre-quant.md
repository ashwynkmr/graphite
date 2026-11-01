# 0001. Narrow quant to mental-math drills, not full GRE problems
2026-10-31 · Accepted · Planning · Product

## Context
The first idea was a general GRE quant practice app with full exam-style problems. Thinking about how the two users actually study changed that: the real bottleneck is calculation speed (percents, fractions, ratios, estimation done in the head), not knowing which concept to apply. Full problems also need paper and pen and several minutes each, which doesn't fit 5–15 minute sessions on a phone.

## Options
- **Full GRE quant problems** (geometry, multi-step algebra, data interpretation): closest to the exam, slow per item, needs scratch paper.
- **Mental-math drills only:** every item solvable in the head in under 60 seconds, as pure calculation or a one- or two-line word problem.
- **Both, side by side:** broadest coverage, roughly double the content and UI work.

## Decision
Mental-math drills only, across nine calculation topics and three difficulty levels. Difficulty is set by how awkward the numbers are, not by harder concepts.

## Trade-offs
No geometry, no multi-step problems, no data-interpretation sets. Users still need other material (official ETS practice) for full problems. That's acceptable because those sources already exist and are good, while a fast, focused arithmetic drill for the phone is what's missing. It also makes the content tractable: calculation questions can be generated and checked by code (see [0002](0002-generated-question-bank.md)).

## Signals to revisit
- Both users hit the 90% Medium accuracy target early and speed stops improving.
- Practice-test reviews show errors are conceptual rather than arithmetic.
- Requests for quantitative-comparison or data-interpretation formats (already parked in Phase 3).
