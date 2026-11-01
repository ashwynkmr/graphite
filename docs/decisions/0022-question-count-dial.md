# 0022. Drill length is a swipe dial from 5 to 40
2026-11-01 · Accepted · Phase 1 · Product

## Context
Quant setup offered three lengths (10, 20, 30) as a segmented control. Ashwyn asked for a rotating dial in steps of 5, from 5 up to 40, so a short warm-up and a long set are both one swipe away.

## Options
- Keep the segmented control and add more segments: eight segments at 375 px are under 48 px each and cramped.
- A stepper (minus / number / plus): compact, but seven taps from 5 to 40.
- A native `<select>`: opens the system wheel on iPhone, but looks out of place on the study-desk design.
- A horizontal dial with native scroll-snap: one swipe, snaps to a value under an ink needle; values tilt away from the centre like a drum.

## Decision
A reusable `Dial` in `src/ui/`: native horizontal scroll-snap (so iPhone momentum feels right), values turned with `rotateY` by distance from the centre, a tick per question, and tap-to-jump. It acts as a `slider` for keyboards and screen readers (arrow keys, Home/End). Quick drill on Home stays at 20.

## Trade-offs
- About 2 KB of extra code and CSS for one control.
- The 3D tilt needed two fixes found on a real phone: the strip could bounce vertically, and its layers drew over the sticky Start button. Both fixed before approval (FB-27, FB-28).
- Lengths above 40 aren't offered; long sets are better split into two drills.

## Signals to revisit
- Mis-swipes (landing one notch off) reported on the phone.
- The same dial wanted elsewhere (vocab session length): reuse it rather than add another control.
