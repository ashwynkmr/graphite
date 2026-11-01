# 0035. Reminders stay inside the app
2026-11-01 · Accepted · Phase 3 · Product

## Context
Ashwyn asked for reminders about paused drills and practice based on performance (FB-23). PRD v0.6 left reminders outside the app as a Phase 3 decision. Graphite has no server, and a web app can't reliably schedule a notification on its own. Real reminders need web push, which needs a backend. The exam is 23 days away.

## Options
- In-app only: the Home suggestion card and resume banner, both already live.
- A calendar file made on the device: a daily reminder at a fixed time, free and offline, but generic.
- Web push on a free backend: personal nudges, but study data leaves the device and the app makes network calls.

## Decision
In-app only, Ashwyn's choice. No calendar file and no push. The reminder item comes off Phase 3. In-app nudges at the end of Results stay planned for Phase 2.

## Trade-offs
- Nothing prompts a learner who doesn't open the app, so a missed day goes unnoticed until the next visit.
- A calendar file was a small build and is given up for now. Anyone can still add their own calendar reminder by hand.
- The privacy and no-server rules stay intact, with nothing new to build or maintain before the exam.

## Signals to revisit
- Either user misses study days because they forgot to open the app.
- The streak breaks repeatedly in the first two weeks of use.
