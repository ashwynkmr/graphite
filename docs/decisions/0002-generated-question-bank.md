# 0002. Generate the question bank from code templates instead of copying questions
2026-10-31 · Accepted · Planning · Content

## Context
The original plan was to source quant questions from the internet. Two problems surfaced. First, copyright: question text from RocketBlocks, ETS, Magoosh and prep books is protected, and the repo has to be public for free hosting. Second, accuracy: scraped answer keys contain errors, and a drill app that marks right answers wrong loses trust fast.

## Options
- **Copy questions from online sources:** fast to start and "real exam" flavour, but legally risky in a public repo and the answer keys can't be trusted.
- **Write every question by hand:** original, but 1,500 hand-typed answers is slow and error-prone.
- **Code templates plus a live generator:** about 80 TypeScript templates with seeded randomness; code computes every answer and builds distractors from named mistakes.

## Decision
Code templates. A build script expands them into `content/questions.json` with stable IDs, and the same templates run in the app to produce fresh numbers once a user has seen most of the bank. About 300 hand-written word problems add variety, each with a `calc` expression that an evaluator checks. Online questions are used only as inspiration for patterns.

## Trade-offs
Less "real exam" flavour: templated wording can feel mechanical, which the hand-written word problems and 6–10 scenario strings per word template are meant to offset. More up-front build effort than copying. In return, every answer is correct unless a template is wrong, and the validator re-runs every template from its stored seed to catch that.

## Signals to revisit
- Users report the wording feels repetitive or robotic.
- Answer-key error reports reach the 5-error ceiling in the success metrics.
