# 0039. Hand-written problems are worked out from formulas
2026-11-01 · Accepted · Phase 1 · Content

## Context
Step 10 adds about 300 hand-written word problems, taking the bank to 1,500 ([0014](0014-quant-drill-before-handwritten-problems.md)). The project's rule is that no quant answer is typed by hand. A formula guards the arithmetic, but not whether the formula fits the story, and templates can't catch that kind of slip.

## Options
- Type answers and spot-check: fast, but breaks the rule.
- Formula only: right arithmetic, possibly for the wrong question.
- Formula, plus automated cross-checks, plus reading every problem.

## Decision
The third. Each problem in `content/handwritten.json` has a formula for its answer and for at least three real mistakes, which become the wrong options. The validator also checks that the formula's numbers appear in the question, that the shortcut reaches the same answer, and that an estimate isn't near the midpoint of two options. Every problem was then read against its calculated answer.

## Trade-offs
- Reading is the only check that a formula fits its story, so an error can still get through.
- Small numbers (1 to 10, 12, 24, 60, 100, 1000) may appear in a formula without being in the question, for words like "half" or "an hour", so a slip among them isn't caught.
- These problems are fixed. The live generator can't make fresh versions.

## Signals to revisit
- A user reports a wrong answer key.
- Hard word problems regularly take well over their target time.
