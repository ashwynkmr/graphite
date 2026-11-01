# Feedback: requests after A3, and the question-count dial
2026-11-01 · Between Milestones A and B · Staging build, uncommitted until approved

## What was tested
Ashwyn used the staging site on their phone to try the new drill-length dial on Quant setup (two rounds). The other items are feature requests recorded in the PRD (v0.6) for later steps.

## Feedback (Ashwyn's words, lightly cleaned up)

| ID | Feedback |
| --- | --- |
| FB-22 | "I want an option to reset account and progress too." |
| FB-23 | Notifications about paused exercises, and reminders to practise that are custom to the user's performance, "like hey, let's do some more fractions, you were weak last time." |
| FB-24 | A private touch for the second user: if and only if one of her names is entered, she also gets short notes from Ashwyn, "as simple as 'Ashwyn says…'", saying Ashwyn loves her and motivating her. |
| FB-25 | "The homepage seems blank." Make it a little better. |
| FB-26 | The question-number section should be a rotating dial in steps of 5, starting at 5, up to 40. |
| FB-27 | "Looks and works good, but the whole scale is moving when I swipe up or down. It should be fixed vertically, allowing only horizontal motion." |
| FB-28 | "Check layering, because the dial is going over the 'Start x questions' button." |
| FB-29 | "Looks great." Update docs, commit and push. |

## What changed because of it

| ID | Response | Record |
| --- | --- | --- |
| FB-22 | PRD v0.6: Settings gets Reset progress (keeps name and settings) and Reset everything (back to the name prompt); both offer Export first and need typing `reset`. Planned for step 9. | — |
| FB-23 | PRD v0.6: in-app nudges from the user's own results (paused drill, weak topic, due words, slow topic, nothing studied today), Phase 2. Notifications outside the app need a push server on iPhone, which breaks offline-first; listed as Phase 3 with options to decide later. | — |
| FB-24 | PRD v0.6, Phase 2: notes signed "Ashwyn says…", at most one a day, never mid-session. Names are matched by hash so they never appear in this public repo; Ashwyn writes or approves every note. | — |
| FB-25 | PRD v0.6: Home adds a today card, a last-session line and one suggested drill. Design options to be shown side by side at step 9. | — |
| FB-26 | New swipe dial (5–40, steps of 5) replaces the 10/20/30 control. Checked at 375 px in light and dark. | [0022](../decisions/0022-question-count-dial.md) |
| FB-27 | The strip was 3 px taller than its box, so iPhone let it scroll and bounce vertically. Now horizontal only; vertical swipes still scroll the page. | [0022](../decisions/0022-question-count-dial.md) |
| FB-28 | The tilted values were drawn above the sticky Start bar. The dial now keeps its layers in its own stack and the Start bar sits on top. | — |
| FB-29 | Committed and pushed. | — |

## What we deliberately didn't change
- Quick drill on Home stays at 20 questions.
- Milestone B (vocab) order is unchanged; FB-22 and FB-25 land in step 9, FB-23 and FB-24 in Phase 2.
