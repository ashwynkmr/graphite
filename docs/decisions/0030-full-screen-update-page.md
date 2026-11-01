# 0030. A full-screen update page, held during sessions
2026-11-01 · Accepted · Phase 1 · Product

## Context
New builds were announced by a small bar on tab screens. At Checkpoint B2, Ashwyn said it was "not very noticeable" and asked for the update to take the whole screen: "We want to force the user direction there." Stale builds had already hidden fixes during review.

## Options
- Make the bar louder.
- A full-screen page at any moment, including mid-session. This was built first, since sessions resume safely after a reload.
- A full-screen page everywhere except during an active session.

## Decision
The third. Ashwyn rejected the second after seeing it: "lets not do during mid session cuz it breaks the flow." A new build replaces the whole app, with one button and no way to dismiss it. If an update is found during a session, it waits, and the page appears when the session ends or is paused.

The tone is light on purpose: "We sharpened the pencil." It says the update won't take a second and doesn't threaten to block studying (FB-55). If the new build hasn't taken over 3 seconds after the tap, the app reloads anyway, since the page has no other exit.

## Trade-offs
- The user can't postpone an update, so someone between sessions must take it.
- The app only learns of a build when it checks, usually on opening, so one left open can stay behind.
- Service-worker registration moved up to the app root, so it also runs during first-run setup.

## Signals to revisit
- The update loop ever fails on a real phone: add a way to dismiss the page.
- An update interrupts results someone was reading.
