# 0050. The first-time tour spotlights each tab on the real screen
2026-11-01 · Accepted · Phase 3 · Design

## Context
Ashwyn asked for a guided tutorial for a first-time user, "minimal, just showing them basic functionality and whats there" (FB-111). Until now a new user got a name prompt and then Home, with nothing pointing out the rest.

## Options
- Welcome cards before Home: simple, but they describe the app without showing where anything is.
- A spotlight walk: dims the real app and lights each tab in turn, with a short note. More code, but shows the real thing.
- One-time hints on each screen: quiet, but easy to miss, and spread over several visits.

## Decision
A spotlight walk with five stops, one per tab, chosen by Ashwyn from side-by-side sketches. It opens each real screen, can be skipped at any stop and starts no session, so it writes no study data.

It appears once, straight after the name prompt. A flag set on that prompt marks it as owed, so people who already have the app never get it unasked. Settings has "Take the quick tour" for anyone who wants it.

## Trade-offs
- The two people using the app now have passed the name prompt, so they only see it from Settings.
- Closing the app mid-tour shows it again next time, until it's finished or skipped.
- Long screens sit dimmed behind the note, so the walk shows what's there without explaining every control.

## Signals to revisit
- A new user still asks where something is.
- The tour is skipped straight away.
