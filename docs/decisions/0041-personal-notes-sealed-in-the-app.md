# 0041. Personal notes are sealed in the app and asked about once a night
2026-11-01 · Accepted · Phase 1 · Product

## Context
Ashwyn wanted notes for the second user every 2 hours, studied or not (FB-85), with no off button and one question each night (FB-86). Planned for Phase 2, moved up by owner request. The repo is public, but her name and the note text must not be.

## Options
- Keep notes on the server: breaks the rule that the phone writes every message ([0037](0037-push-reminders-with-on-device-text.md)).
- Plain text in the app, hidden behind a name check: anyone could read the repo.
- Encrypt the notes in the app, opened only by a matching saved name.

## Decision
Encrypt them. The 100 notes ship as `notes.sealed.json`; the source stays in a git-ignored folder. A matching name opens them; every other name gets normal reminders only. Notes come at 9, 11, 1, 3, 5 and 7, and the server sees only wake-up times. The title "Ashwyn says" names the sender, so the body has no second signature (FB-89).

At 9 pm the last notification asks if she still wants them. "Not for now" stops the notes but not the question; no answer changes nothing. iPhones show no answer buttons, so tapping opens a question screen. Nothing arrives during a session on screen.

## Trade-offs
- A name is a weak password: someone who guesses it could open the notes. Acceptable for this content.
- Six notes a day ignores the app's restraint. The nightly question is the safeguard.

## Signals to revisit
- She answers "Not for now", or finds the nightly question unwelcome.
- Android answer buttons fail. Not yet tested.
- iPhone stops delivering pushes at this rate. Not yet known over several days.
