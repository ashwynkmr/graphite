# 0057. The Progress share is a report card, split into Quant and Verbal
2026-11-05 · Accepted · Post-launch · Design

## Context
The 7- and 14-day share listed totals, three weak topics and a bar chart. Ashwyn didn't like it and asked for something insightful and easy to understand (FB-127), then said mixed numbers made each subject "hard to think through" (FB-128).

## Options
- Report card, Then and now, On pace, or a written note. Then and now can't show much until a full earlier week exists.
- Stacked sections, or two columns.
- For the score: pen circle, ruler, highlighter, pencil underline, tick, worked answer, hundred grid, number line or protractor.

## Decision
A mix of Report card and On pace, in two columns (FB-128, FB-129). The top has the GRE countdown and a tick per day studied. Quant has its score on a number line, with an arrow from last week to now (FB-131), plus questions, best topic and what needs work. Verbal has words seen on a ruler, the daily pace against the pace needed, and words known well. A short note is worked out from the same numbers.

The comparison needs 10 answers in the earlier period, and a topic needs 10 answers to be named. Pace counts only days since studying began.

## Trade-offs
- "Verbal" covers vocab only; the app has no reading comprehension.
- The pace moves with a light week.
- "Up from" stays hidden until an earlier period has enough answers, so early cards say less.
- The note is rule-based, so it can read repetitively.

## Signals to revisit
- The card is hard to read after a chat app compresses it. Not yet tested.
- The needed pace feels discouraging late on, when it grows large.
