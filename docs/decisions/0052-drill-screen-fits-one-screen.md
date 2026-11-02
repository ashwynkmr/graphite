# 0052. The drill screen fits one screen, so Submit is always in reach
2026-11-01 · Accepted · Phase 3 · Design

## Context
At 375 × 664, about the height of an iPhone with Safari's toolbars showing, a long word problem with the keypad made the page 858 px tall. Submit sat below the fold, against the mobile-first rule of a thumb-reachable keypad. Checkpoint 1 flagged this, and new word problems would have met it more often.

## Options
- Leave it, since scrolling works: slow in a timed drill.
- Shrink the type on every phone: hurts tall phones that have room.
- Make the screen exactly one screen tall and tighten only short screens.

## Decision
The drill screen is one screen tall. The header and keypad or options stay fixed, and the question area between them scrolls if it must. Below 720 px tall, the question type drops a step, the ruled lines tighten to match, and keys and options go from 52 to 48 px, the minimum tap size.

A browser test places the bank's longest question on the screen in both answer modes at 375 × 664, and fails if the page or question area scrolls, or Submit is out of view.

## Trade-offs
- Smaller question type on short screens only.
- A smaller phone than tested, or a longer question later, may scroll inside the question area, but Submit stays in reach.
- Fitting isn't yet checked on a real phone.

## Signals to revisit
- A question is hard to read on a short screen.
- A real phone shows its toolbars covering the keypad.
