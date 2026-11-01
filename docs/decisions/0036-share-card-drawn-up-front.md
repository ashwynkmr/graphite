# 0036. The share image is drawn up front, always in the light theme
2026-11-01 · Accepted · Phase 1 · Technical

## Context
The TRD specifies a canvas image and a text summary handed to the phone's share sheet. Phone browsers open that sheet only straight after a tap, and drawing an image takes time because fonts must load first. The card also needs colours, while the project allows only values from `tokens.css`, and a canvas can't read a theme that isn't active.

## Options
- Draw the image when Share is tapped: simple, but the browser may refuse the sheet afterwards.
- Draw it when the results screen opens, and hand it over on tap.
- Copy the colours into the drawing code, or read them from `tokens.css`.

## Decision
Draw on opening results; the button stays disabled until the image is ready. The card always uses the light paper theme, read from the first definitions in `tokens.css`, so a share looks the same from a phone in dark mode. It leaves out the user's name and individual answers. Where sharing isn't offered, the app copies the text and saves the image. Vocab sessions with no answers don't offer Share.

## Trade-offs
- Every results screen draws an image, even if nothing is shared.
- A dark-mode user shares a light card.
- Reading colours with a pattern depends on the order in `tokens.css`; a unit test covers it.

## Signals to revisit
- The share sheet fails on a real phone. Not yet tested.
- The first share on a slow phone leaves Share disabled for a noticeable time.
