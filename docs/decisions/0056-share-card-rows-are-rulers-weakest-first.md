# 0056. Share card rows are rulers, weakest topic first
2026-11-03 · Accepted · Post-launch · Design

## Context
After `v3.0.0`, Ashwyn shared a 5-question drill. The card showed "0 of 5", but its rows added up to 4, because it kept only the 4 topics with the most questions (FB-121). Ashwyn also couldn't tell what the row of 10 pencil slashes meant, and guessed correctly that it stood for a percentage (FB-122). Ashwyn then asked for weakest topics first (FB-123).

## Options
- A plain bar, like the results screen. Ashwyn liked it, then asked for something more classroom-like.
- A pencil that grows, a highlighter stroke or a teacher's circled percentage.
- A ruler shaded up to the score.

## Decision
Ashwyn chose the ruler (FB-124). Each row is a ruler with a mark every 10%, shaded up to the score, followed by the count and the percentage in numbers. The vocab and history cards use it too, and so does the results screen, whose "By topic" list also runs weakest first (FB-125).

Quant rows run weakest to strongest; on a tie, the topic with more questions comes first. Every topic gets a row, up to 7. A session with more than 7 topics shows the weakest 6 and folds the strongest into "Other topics", so the rows always add up to the score.

## Trade-offs
- The ruler is the busiest of the options drawn, so the printed percentage does the exact reading.
- A strong topic can be hidden inside "Other topics".
- The vocab card keeps Know it, Unsure, Review, since those are ratings rather than scores by topic.

## Signals to revisit
- The ruler marks are hard to read once the image is sent through a chat app. Not yet tested.
