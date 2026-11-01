# 0006. Mix of typed and multiple-choice answers
2026-10-31 · Accepted · Planning · Product

## Context
Drills could ask for exact typed answers only, which trains calculation. But the GRE also rewards estimating, eliminating and guessing well among multiple-choice options. Ashwyn wanted the drills to train both habits.

## Options
- **Typed only:** pure calculation practice, simplest to build.
- **Multiple choice only:** trains elimination, but lets users recognise answers instead of computing them.
- **Mix:** about half typed and half multiple choice per drill, with typed-only and MCQ-only modes available.

## Decision
Mix is the default. Typed answers use a numeric keypad that accepts equivalent forms (0.5 = .5 = 1/2). Multiple choice has five options (A–E) whose wrong answers are built from named mistakes: wrong base for a percent change, adding percents instead of chaining, inverting a ratio, a dropped decimal place. Estimation questions are always multiple choice.

## Trade-offs
More content work: every MCQ-capable template needs distractor rules, plus checks that no distractor equals the answer after rounding and no two distractors are equal. At least 70% of questions must carry choices so Mix has enough MCQs per topic. Badly built distractors would train nothing, so they are a named risk in the PRD.

## Signals to revisit
- Results show MCQ accuracy far above typed accuracy on the same topics (distractors too easy).
- Users consistently switch away from Mix.
