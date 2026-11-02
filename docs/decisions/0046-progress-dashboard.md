# 0046. How the Progress dashboard reads
2026-11-01 · Accepted · Phase 2 · Design

## Context
The PRD asks for 14-day trends per topic, the three weakest topics and more, without saying how they fit a phone with no hover, or when a topic counts as weak.

## Options
- **Topic trends:** one line per topic on one chart, nine small charts, or one chart with a topic picker.
- **Reading a value:** a number on every point, or tap a day to read it.
- **Weakest:** the lowest three whatever the numbers, or only with enough answers.

## Decision
- **Trends:** a picker above two single-line charts, accuracy and seconds a question. Each has one axis and one ink colour. Days without study stay gaps, not zeros.
- **Reading:** tap a day and its value shows above the chart. It starts on the latest day with data.
- **Weakest:** the lowest three of the last 14 days with at least 10 answers and below 100%. Marked with a word, in ink: red and green stay on results.
- **Levels:** each topic's Adaptive level shows in the topic table once Adaptive has been used (FB-97).
- **Mistake log:** filter by topic, or by how a word was missed. Drill my mistakes follows the filter.
- **Share:** a 7- or 14-day card with a small bar chart. It carries no name and no answers.

## Trade-offs
- Topics can't be compared on one chart; the table does that job.
- With under 10 answers per topic, nothing is marked weakest early on.
- Day columns are narrower than the 48 px tap target, though each runs the chart's full height.

## Signals to revisit
- Day columns prove hard to tap on a real phone.
