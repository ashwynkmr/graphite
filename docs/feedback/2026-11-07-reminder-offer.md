# Feedback: What's New and the reminder offer
2026-11-07 · After `v3.0.0` · Chat, with drawn options

## What was tested
Claude drew three ways to offer reminders as text sketches, and Ashwyn chose one. Claude then built it and checked it on a computer at 375 px: What's New, the reminder screen, the Home card, and the iPhone steps (by imitating Safari on iPhone). It hasn't yet been checked on a real phone, and turning reminders on wasn't checked end to end, since a test browser can't reach a phone's push service.

## Feedback (Ashwyn's words)
Lightly tidied for spelling, as Ashwyn asked for answers to be cleaned up for the docs.

| ID | Feedback |
| --- | --- |
| FB-136 | "I also need an update summary screen, and a reminder (well advertised) to turn the notifications on. Get the users to somehow get there. It's essential." |
| FB-137 | Of three options, chose "Own screen + Home card". |
| FB-138 | "The notification ad should be generic so it applies to both Android and iOS" (about the Safari sentence). |

## What changed because of it

| ID | Response | Record |
| --- | --- | --- |
| FB-136 | What's New for release `3.1.0`, and a reminder offer after it. | [0059](../decisions/0059-reminder-offer-screen-and-home-card.md) |
| FB-137 | A one-time reminder screen, and a Home card while reminders are off. | [0059](../decisions/0059-reminder-offer-screen-and-home-card.md) |
| FB-138 | The card and screen say the same on every phone; the Home Screen steps show only where needed, after Turn on. | [0059](../decisions/0059-reminder-offer-screen-and-home-card.md) |

## What deliberately didn't change
- The Settings section for reminders.
- What reminders send and when ([0037](../decisions/0037-push-reminders-with-on-device-text.md)).

## Not yet known
- Whether people turn reminders on from it.
