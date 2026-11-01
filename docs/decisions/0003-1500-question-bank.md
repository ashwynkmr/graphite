# 0003. 1,500-question bank with a 7-day no-repeat rule, not 1,000
2026-10-31 · Accepted · Planning · Content

## Context
The first plan was a 1,000-question bank. The volume math didn't hold up: at 100–200 questions a day over about 21 days, one user answers 2,100–4,200 questions. A fixed bank of 1,000 would start repeating within 5–10 days, and repeated questions train memory of answers rather than calculation.

## Options
- **1,000 fixed questions:** less content work; repeats within the first week of heavy use.
- **1,500 fixed questions plus a live generator:** the owned bank covers the first stretch; the generator makes fresh numbers once a topic and difficulty are mostly seen.
- **Generator only, no fixed bank:** unlimited, but no stable IDs to review, fix or report, and no curated hand-written problems.

## Decision
A 1,500-question curated bank (about 1,200 generated from templates and about 300 hand-written) plus the live generator. A question isn't shown again within 7 days unless it's in the mistake log or a Retry wrong session. The generator kicks in when a user has seen 90% of the bank for a topic and difficulty.

## Trade-offs
More content to build and validate before launch, which competes with the Nov 1 start (see [0014](0014-quant-drill-before-handwritten-problems.md)). Generated questions beyond the bank don't have the same human spot-check, though they come from the same tested templates.

## Signals to revisit
- Users notice repeats inside 7 days (a bug or a thin topic).
- Bank usage data shows a topic and difficulty exhausted early, which means that pair needs more templates.
