# 0037. Push reminders, timed and written on the phone
2026-11-01 · Accepted; hosting replaced by [0038](0038-reminder-service-on-cloudflare.md) · Phase 1 · Product

Supersedes [0035](0035-in-app-reminders-only.md).

## Context
Ashwyn first chose in-app reminders, then asked what true notifications would take. Web push needs a server, which Graphite didn't have. After a fixed daily reminder reached a phone, Ashwyn asked that notifications be usage based as well.

## Options
- Fixed daily reminder: simple, but ignores what the user did.
- Server applies the rules: needs study data uploaded.
- Phone applies the rules and sends only wake-up times.

## Decision
The third, as an opt-in, with a small separate server planned for Northflank, where BusyFit's docs place their app. The phone plans from its own data: quiet once studied, one nudge for a paused session, a streak warning, fewer after days away, at most 2 a day. It replans when the app is used and after each wake-up. The server sends empty pushes at those times, and the phone writes the message.

## Trade-offs
- It's the app's first runtime network call, so the offline rule in `CLAUDE.md` gained one exception. Studying doesn't depend on it.
- Wake-up times can show roughly when someone studies.
- A plan made offline can go stale, and every push must show a message, so a reminder can arrive after studying.
- A server now exists to keep running; if it stops, reminders stop silently.

## Signals to revisit
- Reminders feel like nagging.
- iPhone stops delivering, or the server becomes a chore before the exam.
