# 0059. Reminders are offered on their own screen, then kept on Home
2026-11-07 · Accepted · Post-launch · Product

## Context
Reminders ([0037](0037-push-reminders-with-on-device-text.md)) were only in Settings, below the fold, so it was easy never to find them. Ashwyn called turning them on "essential" and asked for it to be "well advertised", with a What's New screen for the updates since `v3.0.0` (FB-136).

## Options
- A box at the top of What's New, plus a Home card.
- A Home card only.
- Its own screen once, plus a Home card.

## Decision
Ashwyn chose its own screen plus a Home card (FB-137).

- **The screen** shows once, after What's New, to anyone who has the app and no reminders, and never during a session. It says what reminders do, takes the usual study time, and turns them on from one tap. Not now dismisses it for good.
- **The Home card** sits at the top of Home while reminders are off. Turn on asks for permission straight from the tap. Not now hides it for 3 days.
- **The wording is the same on every phone.** Where reminders can't work yet (iPhone in Safari), Turn on opens the screen, which then shows the Home Screen steps, with a backup first, since the Home Screen app starts with empty storage.

What's New moves to release `3.1.0`, listing vocab difficulty, rulers, weakest first and the Progress report card. No release tag: these stay small updates.

## Trade-offs
- A card that returns every 3 days can feel like nagging. It's one card with a clear Not now, never during a session.
- Reminders still need the push server, which is the only runtime network call; studying never depends on it.

## Signals to revisit
- Reminders still off after a week, or Not now tapped every time.
