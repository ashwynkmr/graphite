# 0031. The name on screen is a large small g, then capitals
2026-11-01 · Accepted · Phase 1 · Design

## Context
Ashwyn asked that wherever the name appears in the app, the G be a small g in a larger text size than the rest. The name shows on the first-run setup label, the update page label and one sentence on the update page. The labels used uppercase styling, which would have turned the g into a capital. The app icon is already a serif lowercase g ([0021](0021-app-icon-serif-g-with-pen.md)).

## Options
- Lowercase throughout, with a 20 px g and 16 px "raphite". Built first; Ashwyn asked for it bolder and bigger.
- Capitals in labels, lowercase in the sentence. Built second; Ashwyn asked for caps in the sentence "for consistency".
- gRAPHITE everywhere: a 28 px g and 14 px spaced capitals.

## Decision
The third, as one `Wordmark` component in `src/ui/`, using only existing tokens. It is Newsreader at weight 500 in full graphite, so it stands out in grey text.

Plain-text places can't mix sizes, so the browser tab and the home-screen name stay "Graphite". Ashwyn said the name under the icon is fine. Backup import errors will use the wordmark once step 9 puts them on screen.

## Trade-offs
- Two spellings exist: gRAPHITE in the app, Graphite in system text and docs.
- A serif mark inside an Inter sentence draws the eye.
- Line height is set to zero so the large g can't push lines apart, which leaves its descender close to whatever sits below it.

## Signals to revisit
- The g touches other text at some font setting or screen size.
- The mark reads as a typo rather than a name to the second user.
