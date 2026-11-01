# 0034. Mistake drills split by kind; reset progress clears stars
2026-11-01 · Accepted · Phase 1 · Product

## Context
Step 9 put the mistake log, backup and two-level reset on screen. The PRD says "Drill my mistakes" builds a drill from the log, but quant questions and words run in different session types. It lists what Reset progress clears without mentioning stars, which are stored with the vocab boxes. Exporting from an app opened from the iPhone home screen can't rely on a normal download.

## Options
- One mixed mistake session, which would need a new session type.
- Separate Quant and Words tabs, each starting its own session of the existing type.
- Keep stars through a reset by rewriting word states, or clear them with the boxes.

## Decision
Two tabs. Each drill takes the oldest items first, up to the usual drill or session length. Quant uses Mix answers; words use the usual practice types. Items that no longer exist in the content files are hidden.

Reset progress clears stars, and the screen says so. Reset everything also clears the name and settings. Both offer Export first and need `reset` typed on the page, since some in-app browsers refuse `window.confirm`. Import checks the file and asks on the page before replacing anything.

On an iPhone home-screen app, Export opens the share sheet. Everywhere else it downloads the file.

## Trade-offs
- A learner with both kinds of mistake runs two sessions.
- Someone who resets progress loses their hard-words list unless they exported first.
- The list shows every item, so it can get long.

## Signals to revisit
- Export fails on a real iPhone. Not yet tested.
- The long list becomes slow or tiring to scroll.
