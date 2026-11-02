# 0045. Sprint time is a dial, and search results sit right under the bar
2026-11-01 · Accepted · Phase 2 · Design

## Context
On review at checkpoint 2, Ashwyn asked for sprint time to use the same dial as question count, from 30 seconds in 30-second steps up to 15 minutes (FB-103). This replaces the 2, 5 or 10 minutes in [0043](0043-sprint-adaptive-and-topic-memory.md).

Ashwyn also found that a searched word showed only in the search bar (FB-102). The likely cause: on a phone the keyboard covers the lower half of the screen, and the filters pushed results below it. Desktop-size checks can't show that.

## Options
- **Search:** make the filters collapsible, move them below the results, or hide them while typing.
- **Result:** keep every row closed, or open the best match.

## Decision
- **Dial:** 30 steps, shown as 0:30 to 15:00, starting at 5:00. Labels use a smaller size to fit the dial's slots. A sprint lines up 25 questions a minute, as before.
- **Search:** filters hide while there's search text, and search covers all words. The best match opens by itself, with the word large, straight under the bar. Clearing the text brings the filters back as they were.

## Trade-offs
- Search can't be combined with a filter on screen. Nothing in the review asked for that.
- 30 dial stops take more swiping to reach long times.
- A very short sprint gives little to review.

## Signals to revisit
- The word still doesn't show clearly on a real phone. The keyboard cause is inferred, and only Ashwyn's phone can confirm it.
- Ashwyn wants to filter while searching.
