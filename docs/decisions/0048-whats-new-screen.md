# 0048. New features are announced on a one-time screen after the update
2026-11-01 · Accepted · Phase 2 · Product

## Context
Ashwyn wanted the Phase 2 launch to tell users what came for them (FB-94). The app has no accounts or email, and notifications only reach people who turned reminders on. An old install can't announce anything new until it has updated, which usually takes opening the app.

## Options
- A notification: reaches only reminder users, and only after the update it's announcing.
- A one-time screen straight after the update: reaches everyone who updates, and costs one tap.
- A note on Home: easy to skip, and it adds clutter.

## Decision
A one-time full-screen list, grouped by Quant, Vocab and Progress, in plain words. It shows once to anyone who had a name saved before this launch, on the first start after updating. It waits while a session is open, so it never interrupts study. People installing fresh skip it, since everything is new to them. Settings keeps a What's New entry to reread it.

The release number lives in the code, so each future launch only needs a new list and a new number.

## Trade-offs
- Someone who never opens the app never sees it. They also haven't got the features.
- Restoring an older backup can show it once more, since the backup says it hasn't been seen.
- One extra tap before studying, once.

## Signals to revisit
- The list grows too long to read on one screen.
- Ashwyn wants a notification as well.
