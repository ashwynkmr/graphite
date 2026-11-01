# 0032. Home is a desk with tally marks and one suggestion card
2026-11-01 · Accepted · Phase 1 · Design

## Context
Ashwyn said the Milestone A Home "seems blank". PRD v0.6 asked for a today card, a last-session line and one suggested drill, with options shown side by side first. Three were rendered at 375 px with sample numbers: one notebook page (A), plan first (B), and a desk with tally marks (C). The preview is in `docs/feedback/assets/2026-11-01-home-options.png`.

## Options
- A: countdown and today's progress in one ruled card, simple tick rows, a suggestion card below.
- B: small countdown, suggestion on top, each plan row starts that work.
- C: countdown and streak as two cards, buttons high up, tally marks, a margin-note suggestion.
- A mix of A and C.

## Decision
The mix, as Ashwyn asked: C's layout and tally marks with A's suggestion card. Each goal shows five gates of five strokes, filled one stroke at a time, with the exact count beside them. Only a met goal fills every stroke. The "Choose topics and settings" link and the line under Quick drill were dropped, since the Quant tab does that job.

## Trade-offs
- Tally marks are harder to read at a glance than a bar, so the numbers stay.
- With a suggestion and a last session, the last-session line sits close to the tab bar on a 664 px screen.
- The ruled notebook card from the old Home is gone, which leaves fewer study-desk cues.

## Signals to revisit
- The tally marks read as clutter on a real phone.
- The buttons or the suggestion fall below the fold once a resume banner is showing and it gets in the way.
