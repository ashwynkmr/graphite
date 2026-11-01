# 0011. Launch with 600 words, add the rest in batches
2026-10-31 · Accepted · Planning · Scope

## Context
The deck is 1,500 words ([0005](0005-1500-words-200-a-day.md)) and every entry is original writing ([0004](0004-word-list-sourced-content-original.md)). Writing and reviewing 1,500 entries before Nov 1 isn't realistic alongside building the app.

## Options
- **Wait for all 1,500:** complete deck at launch, and vocab starts days late.
- **Launch with 600 words (ranks 1–600) and add 300+ a day:** vocab starts on time; the deck grows during use.
- **Launch with 200:** one day of new words, too thin a buffer if content slips.

## Decision
Launch with ranks 1–600, written in batches of 100 and validated. At 200 new words a day that's 3 days of new words. After launch, add words 601–1,500 in batches of 300, highest-frequency first, so the deck stays ahead of the daily cap.

## Trade-offs
The deck grows during use, so the content pipeline is on the critical path for the first week: if batches slip, the new-word queue runs dry by day 4. Words added later get the same validation but less review time. Round 2 can't start until all 1,500 are in and seen.

## Signals to revisit
- A batch slips and the new-word queue gets within a day of running out.
- Review of later batches shows more errors than the launch set.
