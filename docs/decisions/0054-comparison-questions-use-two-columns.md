# 0054. Comparison questions use two columns
2026-11-01 · Accepted · Phase 3 · Design

## Context
A comparison question shows two quantities and four fixed answers, and it has to fit a 375 px phone screen with Submit in reach ([0052](0052-drill-screen-fits-one-screen.md)). The real exam sets the quantities side by side. Three layouts were drawn at checkpoint 3.

## Options
- A, two columns: side by side, as on the exam, and the shortest card.
- B, stacked: one quantity above the other, with the most room for long text, and the tallest card.
- C, labelled rows: the label on the left and larger values, but further from the exam's layout.

## Decision
A, chosen by Ashwyn (FB-115). Only A was ever built, so the picture of B and C stays as the record of what was compared.

## Trade-offs
- Each column is narrow, so a wordy quantity has less room. A browser test already caught one question too wordy for its column, and it was rewritten.
- New comparison templates have to keep their quantities short.

## Signals to revisit
- A quantity that is hard to read or cut off on a phone.
- New templates that can't be written short enough for a column.
