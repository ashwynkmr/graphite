# Feedback

Ashwyn tests every checkpoint on a staging site before anything is committed ([0016](../decisions/0016-review-gate-staging-before-commit.md)). Each round gets a file with what was tested, the feedback in Ashwyn's words, what changed and what deliberately didn't. Every item has an ID so it can be traced to the change it caused.

**Status:** Open · Planned · Built (awaiting review) · Done (approved) · No change (kept as is, on purpose)

## Rounds

| Date | Checkpoint | Tested | File |
| --- | --- | --- | --- |
| 2026-10-31 | A1: app shell | Install on phone | [2026-10-31-A1](2026-10-31-A1.md) |
| 2026-10-31 | A1 + A2: shell, question bank | Phone install; 30-question sample | [2026-10-31-A1-A2](2026-10-31-A1-A2.md) |
| 2026-10-31 | A3: quant drills | Staging on phone | [2026-10-31-A3](2026-10-31-A3.md) |

## Tracker

| ID | Area | Feedback (short) | Response | Status | Record |
| --- | --- | --- | --- | --- | --- |
| FB-01 | Platform | Install and full-screen launch work | — | No change | |
| FB-02 | Design | Icon should be classier, fun and look educational; keep the G | Three options shown; resolved by FB-16 | Done | |
| FB-03 | Design | Look is OK but needs more design, still minimal | Polish pass: margin rule, type scale, greeting | Done | |
| FB-04 | Navigation | Tab bar reach and labels are good | — | No change | |
| FB-05 | Navigation | Keep the five tabs and their order | — | No change | |
| FB-06 | Content | Answers look fine; needs hands-on testing | No answer issues reported at A3; keep watching | Open | |
| FB-07 | Content | Difficulty too low: shift each level up; Hard = GRE's hardest | Recalibrated all templates | Done | [0017](../decisions/0017-difficulty-up-one-level.md) |
| FB-08 | Content | Wrong options must include real mistakes, not only giveaways | Two or more named-mistake options per question | Done | [0018](../decisions/0018-distractors-real-mistakes.md) |
| FB-09 | Content | Word problems read naturally | — | No change | |
| FB-10 | Quant | Pick topics in Quant; default "give me anything" | Topic picker with Mixed default | Done | |
| FB-11 | Personal | Ask for name, remember it, personalise encouragement | Name prompt; cheer word later removed (FB-14) | Done | [0019](../decisions/0019-personal-name-and-encouragement.md) |
| FB-12 | Process | No commit or push until staging is approved | Review gate per checkpoint | Done | [0016](../decisions/0016-review-gate-staging-before-commit.md) |
| FB-13 | Quant | Drill and results functionality feels great | — | No change | |
| FB-14 | Personal | Drop the cheer-word question; motivate by name only | Removed everywhere | Done | [0020](../decisions/0020-name-only-encouragement.md) |
| FB-15 | Quant | Difficulty should be multi-select (e.g. Easy + Medium) | Multi-select; drills mix chosen levels | Done | |
| FB-16 | Design | Logo: pencil as the G on a complementary spiral-notebook background | First hybrid; refined by FB-17 | Done | |
| FB-17 | Design | The whole G should be one continuous pencil, maybe cursive | One bent pencil in a cursive G; rejected (FB-18) | Done | |
| FB-18 | Design | Lowercase g in an elegant font; show a pen version too | Serif g with pencil, and with fountain pen | Done | |
| FB-19 | Design | Prefers the fountain-pen version | Pen version is the icon | Done | [0021](../decisions/0021-app-icon-serif-g-with-pen.md) |
| FB-20 | Quant | Difficulty multi-select still doesn't work | Root cause: ambiguous control + stale build; toggle chips and update bar on every tab | Done | |
| FB-21 | Process | A3 approved; update logs, commit and push | Committed, pushed, tagged v0.1.0 | Done | |
