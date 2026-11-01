# Roadmap

Last updated 2026-11-01. Study starts Nov 1; exam Nov 24, 2026. Phase scope is defined in the [PRD](PRD.md#scope-and-release-phases); changes to it are recorded below and in the [decision log](../decisions/README.md).

## Phase 1: launch (target Nov 1–2)

Built in three milestones so studying can start before all of Phase 1 is done ([0014](../decisions/0014-quant-drill-before-handwritten-problems.md)).

| Milestone | Steps | Target | Status |
| --- | --- | --- | --- |
| **A. Quant drills live** (`v0.1.0`) | 1 Scaffold + deploy · 2 Engine · 3 Generators + ~1,200-question bank · 4 Data layer · 5 Quant flow + minimal Home | Nov 1 | **Shipped Oct 31** as `v0.1.0` ([retro](../retros/milestone-a-retro.md)) |
| **B. Vocab live** (`v0.2.0`) | 6 Ranked word list · 7 Word entries (all 1,500; plan was 600) · 8 Vocab flow | Nov 1–2 | **Shipped Nov 1** as `v0.2.0` ([retro](../retros/milestone-b-retro.md)) |
| **C. Rest of Phase 1** (`v1.0.0`) | 9 Mistake log, full Home (today card, last session, suggested drill), Progress, Settings with two-level reset, Share · 10 ~300 hand-written problems (bank → ~1,500) · 11 Launch pass | Nov 2 | In progress: steps 9 and 10 and push reminders live; step 11 under way |

## Phase 2: first week (by Nov 7)

Starts only when Ashwyn says go.

- Sprint mode and Adaptive difficulty
- Round 2, Browse and search
- Full dashboard: 14-day trends, weakest topics, words per box
- Share 7- or 14-day history
- Mnemonics for the hardest ~200 words; per-topic defaults; mistake-log filters
- In-app study nudges from the user's own results (weak topic, slow topic, due words, paused drill)

## Phase 3: later (optional)

Quantitative comparison and data-interpretation questions, audio pronunciation, score predictor, compare with a friend (needs a free backend), Android APK.

## What moved

| Date | Change | Why | Record |
| --- | --- | --- | --- |
| 2026-11-01 | Personal notes for the second user moved from Phase 2 into Phase 1 | Owner request | [0041](../decisions/0041-personal-notes-sealed-in-the-app.md) |
| 2026-11-01 | Reminder service moved from Northflank to Cloudflare | Northflank security incident | [0038](../decisions/0038-reminder-service-on-cloudflare.md) |
| 2026-11-01 | Usage-based push reminders added ahead of step 10; supersedes in-app only | Owner request | [0037](../decisions/0037-push-reminders-with-on-device-text.md) |
| 2026-11-01 | Reminders outside the app removed from Phase 3; in-app only | Owner decision | [0035](../decisions/0035-in-app-reminders-only.md) |
| 2026-11-01 | Share card split from the rest of step 9, as its own checkpoint | Get the main screens reviewed sooner | [FB-67](../feedback/README.md) |
| 2026-11-01 | Type-in removed; Sentence Equivalence added to Practice | Owner review at B2 | [0028](../decisions/0028-remove-type-in-practice.md), [0029](../decisions/0029-sentence-equivalence-hand-checked-pairs.md) |
| 2026-11-01 | Update bar replaced by a full-screen page, held during sessions | Owner review at B2 | [0030](../decisions/0030-full-screen-update-page.md) |
| 2026-11-01 | All 1,500 entries written for launch (plan was 600), validated per batch without sample reviews | Owner request | [0026](../decisions/0026-write-all-1500-entries-before-launch.md) |
| 2026-11-01 | Vocab screens (step 8) built with 100 entries, before the other 500 | Owner request: closer to an MVP | [0024](../decisions/0024-vocab-screens-before-all-600-words.md) |
| 2026-11-01 | Flashcards marked by swiping; practice types can be mixed; card count is a 25–400 dial | Owner review on staging | [0025](../decisions/0025-swipe-flashcards-and-mixed-practice.md) |
| 2026-11-01 | Drill length became a 5–40 dial (was 10/20/30) | Owner request, Nov 1 | [0022](../decisions/0022-question-count-dial.md) |
| 2026-11-01 | Added: two-level reset (C), fuller Home (C), study nudges (Phase 2), personal note for the second user (Phase 2), reminders outside the app (Phase 3) | Owner request, Nov 1 | [FB-22–FB-25](../feedback/README.md) |
| 2026-10-31 | Hand-written word problems moved from build step 4 (TRD) to step 10, after the quant flow | Get a usable drill live on Nov 1 | [0014](../decisions/0014-quant-drill-before-handwritten-problems.md) |
| 2026-10-31 | Name prompt and personal encouragement added to Phase 1 (not in the original PRD) | Owner request after A2 | [0019](../decisions/0019-personal-name-and-encouragement.md) |
| 2026-10-31 | Every difficulty raised one level before launch | Owner review of A2 sample | [0017](../decisions/0017-difficulty-up-one-level.md) |
| 2026-10-31 | Review gate: every checkpoint approved on staging before commit | Owner request after A2 | [0016](../decisions/0016-review-gate-staging-before-commit.md) |
| 2026-10-31 | Difficulty became a multi-select (mix levels in one drill) | Owner request at A3 | [feedback FB-15](../feedback/2026-10-31-A3.md) |
| 2026-10-31 | Cheer word dropped; encouragement by name only | Owner request at A3 | [0020](../decisions/0020-name-only-encouragement.md) |
