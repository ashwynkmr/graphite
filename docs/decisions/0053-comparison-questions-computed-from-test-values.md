# 0053. Comparison answers are computed by trying values, and stored as codes
2026-11-01 · Accepted · Phase 3 · Content

## Context
Quantitative Comparison is a real exam format with four fixed answers: Quantity A is greater, B is greater, they're equal, or it can't be determined. Project rules forbid typing answers by hand, and the last answer is the hard one: code has to show that no single relationship holds. The app also assumes every answer is a number.

## Options
- Write the answers into each template: fast, and breaks the rule.
- Reason symbolically: exact, but far too much machinery for a phone app.
- Try the quantities on many values, and read the answer from what they all say.

## Decision
Try values. Fixed questions compare the two numbers directly. Questions with variables run on a list of test values that fit the question, including negatives, fractions and values around the question's constant. Disagreement means "cannot be determined", and the explanation names two plain values that disagree.

Answers are stored as codes 1 to 4 and labelled on screen, so scoring, mistakes and saved sessions work unchanged. Comparisons keep exam order, and also appear in Typed drills, since there is no number to type.

## Trade-offs
- A finite list could miss a counterexample, so a unit test retries every variable question on thousands of random values.
- Reading the prompt on Results is plainer than on the drill screen.
- "Cannot be determined" is set to about 21% of the topic by choice; the exam's real share is not known to us.

## Signals to revisit
- A report of a wrong answer in this topic.
- More formats need non-numeric answers.
