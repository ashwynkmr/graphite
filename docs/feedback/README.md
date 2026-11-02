# Feedback

Ashwyn tests every checkpoint on a staging site before anything is committed ([0016](../decisions/0016-review-gate-staging-before-commit.md)). Each round gets a file with what was tested, the feedback in Ashwyn's words, what changed and what deliberately didn't. Every item has an ID so it can be traced to the change it caused. For Phase 2, work was committed to a branch as it went and nothing went live until Ashwyn approved the launch ([0042](../decisions/0042-phase-2-on-a-branch-commit-as-we-go.md)).

**Status:** Open · Planned · Built (awaiting review) · Done (approved) · No change (kept as is, on purpose)

## Rounds

| Date | Checkpoint | Tested | File |
| --- | --- | --- | --- |
| 2026-10-31 | A1: app shell | Install on phone | [2026-10-31-A1](2026-10-31-A1.md) |
| 2026-10-31 | A1 + A2: shell, question bank | Phone install; 30-question sample | [2026-10-31-A1-A2](2026-10-31-A1-A2.md) |
| 2026-10-31 | A3: quant drills | Staging on phone | [2026-10-31-A3](2026-10-31-A3.md) |
| 2026-11-01 | Requests after A3; question-count dial | Staging on phone | [2026-11-01-requests-and-dial](2026-11-01-requests-and-dial.md) |
| 2026-11-01 | Step 6: ranked word list | Sources and top 100, in chat | [2026-11-01-step6-word-list](2026-11-01-step6-word-list.md) |
| 2026-11-01 | First 100 entries and vocab screens | Staging on phone, three rounds | [2026-11-01-vocab-screens](2026-11-01-vocab-screens.md) |
| 2026-11-01 | Writing the rest of the deck | In chat | [2026-11-01-all-words](2026-11-01-all-words.md) |
| 2026-11-01 | The app name on screen | Staging, then in chat | [2026-11-01-wordmark](2026-11-01-wordmark.md) |
| 2026-11-01 | C1: mistake log, progress, settings, Home | Staging review of step 9 without Share | [2026-11-01-C1](2026-11-01-C1.md) |
| 2026-11-01 | C2: Share card and reminders | Staging, then in chat | [2026-11-01-C2](2026-11-01-C2.md) |
| 2026-11-01 | C3: push reminders | Staging with a temporary server, on iPhone | [2026-11-01-C3](2026-11-01-C3.md) |
| 2026-11-01 | C4: hand-written word problems | Staging | [2026-11-01-C4](2026-11-01-C4.md) |
| 2026-11-01 | C5: launch pass, fractions, personal notes | Staging and in chat | [2026-11-01-C5](2026-11-01-C5.md) |
| 2026-11-01 | C6: Phase 1 launch | On iPhone and in chat | [2026-11-01-C6](2026-11-01-C6.md) |
| 2026-11-01 | P2-1: Phase 2 start and quant | In chat, then staging | [2026-11-01-P2-1](2026-11-01-P2-1.md) |
| 2026-11-01 | P2-2: Vocab | Staging | [2026-11-01-P2-2](2026-11-01-P2-2.md) |
| 2026-11-01 | P2-3: Progress | Staging and in chat | [2026-11-01-P2-3](2026-11-01-P2-3.md) |
| 2026-11-01 | P2-4: Nudges | Staging | [2026-11-01-P2-4](2026-11-01-P2-4.md) |
| 2026-11-01 | P2-5: Launch | Staging | [2026-11-01-P2-5](2026-11-01-P2-5.md) |
| 2026-11-01 | Phase 3 plan | Scope and tour sketches, in chat | [2026-11-01-P3-plan](2026-11-01-P3-plan.md) |
| 2026-11-01 | Phase 3, checkpoint 1 | Quick tour and 600 new questions | [2026-11-01-P3-1](2026-11-01-P3-1.md) |
| 2026-11-01 | Phase 3, checkpoint 2 | New templates, explanations, Submit in view | [2026-11-01-P3-2](2026-11-01-P3-2.md) |

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
| FB-22 | Settings | Option to reset account and progress | Reset progress and Reset everything in Settings | Done | [0034](../decisions/0034-mistake-drills-and-reset-scope.md) |
| FB-23 | Personal | Reminders about paused drills and practice, based on performance ("more fractions, you were weak last time") | Home suggestion and usage-based push reminders; end-of-Results nudges in checkpoint 4 | Done | [0037](../decisions/0037-push-reminders-with-on-device-text.md) |
| FB-24 | Personal | Cute notes from Ashwyn for the second user, only for her names | Shipped in Phase 1 | Done | [0041](../decisions/0041-personal-notes-sealed-in-the-app.md) |
| FB-25 | Home | Home seems blank; make it better | Streak, today's tally, suggestion, last session | Done | [0032](../decisions/0032-home-desk-layout-tally-and-nudge-card.md) |
| FB-26 | Quant | Question count as a rotating dial, 5 to 40 in steps of 5 | Swipe dial with snap and tilt | Done | [0022](../decisions/0022-question-count-dial.md) |
| FB-27 | Quant | Dial moves vertically when swiping up or down | Horizontal-only scrolling | Done | [0022](../decisions/0022-question-count-dial.md) |
| FB-28 | Quant | Dial draws over the Start button | Dial isolated; Start bar on top | Done | |
| FB-29 | Process | Dial approved; update docs, commit and push | Committed and pushed | Done | |
| FB-30 | Vocab | Top 100: use your own judgement | Kept as ranked; adjust via aliases if a word feels off | Done | [0023](../decisions/0023-word-ranking-core-and-broad-lists.md) |
| FB-31 | Vocab | Should the deck be 1,500 words? | Kept at 1,500; launch with ranks 1–600 | No change | |
| FB-32 | Vocab | Keep inflected adjectives as separate words | Seven forms kept separate | Done | [0023](../decisions/0023-word-ranking-core-and-broad-lists.md) |
| FB-33 | Content | Commit the raw lists as recommended | Committed with origins credited | Done | [0023](../decisions/0023-word-ranking-core-and-broad-lists.md) |
| FB-34 | Vocab | See the entry style before writing batches | Sample of five entries in chat | Done |  |
| FB-35 | Vocab | Entry style approved | Ranks 1–100 written | Done |  |
| FB-36 | Vocab | Screens before the rest of the words, to reach an MVP sooner | Vocab screens built with 100 words | Done | [0024](../decisions/0024-vocab-screens-before-all-600-words.md) |
| FB-37 | Vocab | Card count as a dial, 25 to 400 in steps of 25 | Reused the quant dial | Done | [0025](../decisions/0025-swipe-flashcards-and-mixed-practice.md) |
| FB-38 | Vocab | Mark flashcards by swiping: left wrong, right right, up unsure | Swipe marking with faded marks | Done | [0025](../decisions/0025-swipe-flashcards-and-mixed-practice.md) |
| FB-39 | Vocab | Star at the card's top-right | Star on every card | Done |  |
| FB-40 | Design | Card back must look different from the front | Ink-blue tinted back | Done |  |
| FB-41 | Vocab | Practice types multi-select, to mix e.g. fill-the-blank and flashcards | Multi-select; types dealt evenly | Done | [0025](../decisions/0025-swipe-flashcards-and-mixed-practice.md) |
| FB-42 | Vocab | Show swipe guidance; buttons hide the swiping; make buttons elegant | One-time sway, guide line, round icon marks | Done |  |
| FB-43 | Vocab | Unsure needs an icon like wrong and right | Circled question mark in ink | Done |  |
| FB-44 | Process | Vocab screens approved; log, commit, push | Committed and pushed | Done |  |
| FB-45 | Process | Don't show sample entries for each word batch | Validator plus staging only | Done | [0026](../decisions/0026-write-all-1500-entries-before-launch.md) |
| FB-46 | Vocab | Is every practice type available for each word? | Yes; answered in chat | No change | |
| FB-47 | Vocab | Write all the words | All 1,500 entries written | Done | [0026](../decisions/0026-write-all-1500-entries-before-launch.md) |
| FB-48 | Vocab | Session size grows when cards are marked wrong | No requeue; fixed size | Done | [0027](../decisions/0027-fixed-session-size-missed-words-first.md) |
| FB-49 | Vocab | Results: wrong answers first, then right | Grouped Missed, Unsure, Got right | Done | [0027](../decisions/0027-fixed-session-size-missed-words-first.md) |
| FB-50 | Vocab | Redo the wrong words as flashcards until all are right | Redo button on results, repeats until none missed | Done | [0027](../decisions/0027-fixed-session-size-missed-words-first.md) |
| FB-51 | Vocab | Shorter redo button text; then commit and push | "Redo these N words"; pushed | Done | |
| FB-52 | Vocab | Remove Type-in | Removed from setup; old sessions still open | Done | [0028](../decisions/0028-remove-type-in-practice.md) |
| FB-53 | Design | Update bar isn't noticeable; take the whole screen | Full-screen update page | Done | [0030](../decisions/0030-full-screen-update-page.md) |
| FB-54 | Design | Don't interrupt a session with the update page | Held until the session ends or is paused | Done | [0030](../decisions/0030-full-screen-update-page.md) |
| FB-55 | Design | Update page: say it won't take a second, make it fun | "We sharpened the pencil." | Done | [0030](../decisions/0030-full-screen-update-page.md) |
| FB-56 | Vocab | Add Sentence Equivalence in the free Practice slot | New practice type; 661 hand-checked pairs | Done | [0029](../decisions/0029-sentence-equivalence-hand-checked-pairs.md) |
| FB-57 | Vocab | End session not working in Sentence Equivalence | End moved to the header; on-page confirm, also on End drill | Done | |
| FB-58 | Design | Option marker should be a square, not a circle | Square markers on Sentence Equivalence | Done | |
| FB-59 | Vocab | Full deck flow holds up on the phone | Answered yes | No change | |
| FB-60 | Process | Fix confirmed on the phone; B2 approved | Logged and released as `v0.2.0` | Done | |
| FB-61 | Design | The name's G should be a small g, larger than the rest | `Wordmark` on all three on-screen uses | Done | [0031](../decisions/0031-wordmark-small-g-caps.md) |
| FB-62 | Design | Wordmark bolder and a bit bigger | Weight 500, full graphite, 28 px g | Done | [0031](../decisions/0031-wordmark-small-g-caps.md) |
| FB-63 | Design | Only the g small, the rest all caps, in the sentence too | gRAPHITE everywhere | Done | [0031](../decisions/0031-wordmark-small-g-caps.md) |
| FB-64 | Design | Name under the icon is fine | Stays "Graphite" | No change | |
| FB-65 | Design | Use the wordmark in backup errors | Import errors use `Wordmark` | Done | [0031](../decisions/0031-wordmark-small-g-caps.md) |
| FB-66 | Home | Mix of A and C: C's design and counting graphic, A's weakest-topic card | Built that mix | Done | [0032](../decisions/0032-home-desk-layout-tally-and-nudge-card.md) |
| FB-67 | Process | Share card now or separately: "You pick" | Its own checkpoint, so the main screens were reviewed sooner | Done | |
| FB-68 | Home | Built Home "is good" | Kept | No change | |
| FB-69 | Mistakes | Detail on each mistake card "is fine" | Kept | No change | [0034](../decisions/0034-mistake-drills-and-reset-scope.md) |
| FB-70 | Settings | Export and import on iPhone not checked; "okay for now" | Reported passing with the launch checklist (FB-91) | Done | [0034](../decisions/0034-mistake-drills-and-reset-scope.md) |
| FB-71 | Progress | Totals are enough until Phase 2 trends | Kept | No change | |
| FB-72 | Process | Checkpoint: "I think its pushable" | Logged, committed and pushed | Done | |
| FB-73 | Share | Make the Share card | Share on both results screens | Done | [0036](../decisions/0036-share-card-drawn-up-front.md) |
| FB-74 | Process | Write a brief, fun message to share the app, with Android steps | Written in chat; describes a home-screen icon, since a true widget needs a native app | Done | |
| FB-75 | Reminders | "In-app only" | No calendar file or push | Done | [0035](../decisions/0035-in-app-reminders-only.md) |
| FB-76 | Process | "Push the share card" | Pushed; real share sheet still untested on a phone | Done | |
| FB-77 | Reminders | What true notifications would take; could the BusyFit server be used? | Built as a separate small server with the same kind of setup | Done | [0037](../decisions/0037-push-reminders-with-on-device-text.md) |
| FB-78 | Reminders | "Build push next" | Server, service worker and Settings section | Done | [0037](../decisions/0037-push-reminders-with-on-device-text.md) |
| FB-79 | Reminders | Notifications should be usage based, not just a preset reminder | Phone picks the times from how the user studies | Done | [0037](../decisions/0037-push-reminders-with-on-device-text.md) |
| FB-80 | Reminders | iPhone: message came, tapping worked | Confirmed on a real phone | Done | |
| FB-81 | Process | Keep building notifications the same way; use easy terms, as a beginner | Same behaviour, moved to Cloudflare; plain language from here on | Done | [0038](../decisions/0038-reminder-service-on-cloudflare.md) |
| FB-82 | Reminders | Live service on iPhone: "It arrived, push it" | Committed and pushed | Done | [0038](../decisions/0038-reminder-service-on-cloudflare.md) |
| FB-83 | Content | Start step 10 | 300 word problems; bank at 1,500 | Done | [0039](../decisions/0039-handwritten-problems-from-formulas.md) |
| FB-84 | Process | "Good, push it" | Committed and pushed | Done | |
| FB-85 | Personal | Notes from Ashwyn to the second user every 2 hours, regardless of usage | Tested on Ashwyn's iPhone and shipped | Done | [0041](../decisions/0041-personal-notes-sealed-in-the-app.md) |
| FB-86 | Personal | No off option; ask once each night; no mid-drill notifications; signed from Ashwyn | Tested on Ashwyn's iPhone and shipped | Done | [0041](../decisions/0041-personal-notes-sealed-in-the-app.md) |
| FB-87 | Design | Mixed fractions read badly: 1 1/4 looks like 11/4 | Stacked fractions and raised powers | Done | [0040](../decisions/0040-stacked-fractions.md) |
| FB-88 | Process | "Build and commit and push and update all docs" | Fractions and step 11 so far pushed; notes held | Done | |
| FB-89 | Personal | The title already names Ashwyn; no second signature at the end | Sign-off removed from both notifications | Done | [0041](../decisions/0041-personal-notes-sealed-in-the-app.md) |
| FB-90 | Process | "Rest is okay, you can check, commit and push" | Checked, committed and pushed | Done | |
| FB-91 | Process | "Tests are passing": the real-phone launch checklist | Step 11 closed | Done | |
| FB-92 | Reminders | Answer the nightly question inside the notification, without opening the app | Not possible on iPhones for web apps; rewording offered, and Ashwyn kept it as is | No change | [0041](../decisions/0041-personal-notes-sealed-in-the-app.md) |
| FB-93 | Process | "Finish, commit and push phase 1" | Retro, docs and `v1.0.0` | Done | [Retro](../retros/milestone-c-retro.md) |
| FB-94 | Process | Build Phase 2; keep committing; nothing live until it ends; tell users what's new at launch | `phase-2` branch; What's New screen built | Done | [0042](../decisions/0042-phase-2-on-a-branch-commit-as-we-go.md), [0048](../decisions/0048-whats-new-screen.md) |
| FB-95 | Process | "Your pick for both questions. Use best practices." | Branch and What's New screen | Done | [0042](../decisions/0042-phase-2-on-a-branch-commit-as-we-go.md) |
| FB-96 | Quant | At time-up, count a picked option; don't count an unpicked one | Done, in sprints and timed sets | Done | [0043](../decisions/0043-sprint-adaptive-and-topic-memory.md) |
| FB-97 | Progress | No need to see each topic's level before starting | Level shows in the Progress topic table | Done | [0046](../decisions/0046-progress-dashboard.md) |
| FB-98 | Design | "Fractions look nice now" | Seen on a real phone | Done | [0040](../decisions/0040-stacked-fractions.md) |
| FB-99 | Process | Checkpoint 1: "All good" | Moved on to checkpoint 2 | Done | |
| FB-100 | Vocab | Memory aids: "It's okay" | Kept | No change | [0044](../decisions/0044-round-2-browse-and-memory-aids.md) |
| FB-101 | Vocab | Memory aid shown right away on the card's back: "Fine" | Kept | No change | [0044](../decisions/0044-round-2-browse-and-memory-aids.md) |
| FB-102 | Vocab | A searched word only shows in the search bar; it should show separately underneath | Results sit right under the bar, and the best match opens with the word large | Done | [0045](../decisions/0045-sprint-time-dial-and-search-layout.md) |
| FB-103 | Quant | Sprint time should be a dial, from 30 seconds in 30-second steps up to 15 minutes | Built as asked | Done | [0045](../decisions/0045-sprint-time-dial-and-search-layout.md) |
| FB-104 | Process | Search and the sprint dial: "Yes" | Moved on to checkpoint 3 | Done | |
| FB-105 | Vocab | Bold the word in the flashcard's sentence | Bold on the card's back and in Browse, never in a quiz | Done | |
| FB-106 | Progress | The chart's day line should move in steps when dragged | Dragging moves it from day to day | Done | [0046](../decisions/0046-progress-dashboard.md) |
| FB-107 | Process | Checkpoint 3: "Rest is all good" | Moved on to checkpoint 4 | Done | |
| FB-108 | Process | Checkpoint 4: "Everything works great" | Moved on to the launch checkpoint | Done | |
| FB-109 | Process | "Launch it and record everything on my repo" | `v2.0.0` launched; README, decisions, feedback and retros brought up to date | Done | [Retro](../retros/phase-2-retro.md) |
| FB-110 | Quant, vocab | Phase 3 should only expand and improve the question bank | Scope cut to the bank; new subjects built and approved | Done | [0049](../decisions/0049-phase-3-is-the-question-bank-and-a-tour.md), [0051](../decisions/0051-five-new-quant-subjects.md) |
| FB-111 | Onboarding | A minimal guided tutorial for a first-time user | Spotlight tour built and approved | Done | [0050](../decisions/0050-quick-tour-spotlights-each-tab.md) |
| FB-112 | Process | Launch a few days after the phase is done; the second user stays on the Phase 2 build | One launch planned; date to be set | Planned | [0049](../decisions/0049-phase-3-is-the-question-bank-and-a-tour.md) |
| FB-113 | Process | Checkpoint 1: "Looks good" | Moved on to checkpoint 2 | Done | [2026-11-01-P3-1](2026-11-01-P3-1.md) |
| FB-114 | Process | Checkpoint 2: "I've tested everything so far and it does look good." | Moved on to checkpoint 3 | Done | [2026-11-01-P3-2](2026-11-01-P3-2.md) |
| FB-115 | Quant | Comparison layout: A, two columns | Layout A stays | Done | [0054](../decisions/0054-comparison-questions-use-two-columns.md) |
| FB-116 | Quant | Comparison questions feel okay | No change to the level | No change | [2026-11-01-P3-3](2026-11-01-P3-3.md) |
| FB-117 | Quant | "Cannot be determined" at about 21% should be fine | No change to the mix | No change | [2026-11-01-P3-3](2026-11-01-P3-3.md) |
