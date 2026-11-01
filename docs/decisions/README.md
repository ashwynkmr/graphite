# Decision log

Every meaningful product or technical choice, with the options considered and what was given up. Records are never edited after the fact; a changed decision gets a new record and the old one is marked **Superseded**.

| # | Decision | Date | Status | Phase | Type |
| --- | --- | --- | --- | --- | --- |
| [0001](0001-mental-math-drills-not-full-gre-quant.md) | Narrow quant to mental-math drills, not full GRE problems | 2026-10-31 | Accepted | Planning | Product |
| [0002](0002-generated-question-bank.md) | Generate the question bank from code templates instead of copying questions | 2026-10-31 | Accepted | Planning | Content |
| [0003](0003-1500-question-bank.md) | 1,500-question bank with a 7-day no-repeat rule, not 1,000 | 2026-10-31 | Accepted | Planning | Content |
| [0004](0004-word-list-sourced-content-original.md) | Word list from public frequency lists; all meanings and sentences original | 2026-10-31 | Accepted | Planning | Content |
| [0005](0005-1500-words-200-a-day.md) | Vocab deck of 1,500 words, 200 new a day, then Round 2 | 2026-10-31 | Accepted | Planning | Scope |
| [0006](0006-typed-and-multiple-choice-mix.md) | Mix of typed and multiple-choice answers | 2026-10-31 | Accepted | Planning | Product |
| [0007](0007-results-only-at-end.md) | Results only at the end of a session | 2026-10-31 | Accepted | Planning | Product |
| [0008](0008-no-login-local-progress.md) | No login; progress stays on each device, with Share and Export | 2026-10-31 | Accepted | Planning | Product |
| [0009](0009-pwa-on-github-pages.md) | PWA on free GitHub Pages instead of app-store apps | 2026-10-31 | Accepted | Planning | Technical |
| [0010](0010-phased-release-mistake-log-in-phase-1.md) | Phased release, with the mistake log in Phase 1 | 2026-10-31 | Accepted | Planning | Scope |
| [0011](0011-launch-with-600-words.md) | Launch with 600 words, add the rest in batches | 2026-10-31 | Accepted | Planning | Scope |
| [0012](0012-name-graphite.md) | Name: Graphite | 2026-10-31 | Accepted | Planning | Product |
| [0013](0013-static-react-dexie-hash-routing-ci.md) | Static React + TypeScript app, IndexedDB via Dexie, hash routing, CI-gated deploys | 2026-10-31 | Accepted | Planning | Technical |
| [0014](0014-quant-drill-before-handwritten-problems.md) | Ship a usable quant drill before the hand-written word problems | 2026-10-31 | Accepted | Phase 1 | Scope |
| [0015](0015-leitner-edge-cases.md) | Leitner edge cases: same-session repeats only for misses | 2026-10-31 | Accepted | Phase 1 | Product |
| [0016](0016-review-gate-staging-before-commit.md) | Review every checkpoint on staging before anything is committed | 2026-10-31 | Accepted | Phase 1 | Scope |
| [0017](0017-difficulty-up-one-level.md) | Raise every difficulty by one level; Hard reaches the GRE's hardest | 2026-10-31 | Accepted | Phase 1 | Content |
| [0018](0018-distractors-real-mistakes.md) | Wrong options must include real mistakes, not only near misses | 2026-10-31 | Accepted | Phase 1 | Content |
| [0019](0019-personal-name-and-encouragement.md) | Ask for a name and use it for encouragement, on the device only | 2026-10-31 | Superseded by 0020 (cheer word) | Phase 1 | Product |
| [0020](0020-name-only-encouragement.md) | Encouragement uses the name only; no cheer word | 2026-10-31 | Accepted | Phase 1 | Product |
| [0021](0021-app-icon-serif-g-with-pen.md) | App icon: a serif lowercase g with a fountain pen on a notebook page | 2026-10-31 | Accepted | Phase 1 | Product |
| [0022](0022-question-count-dial.md) | Drill length is a swipe dial from 5 to 40 | 2026-11-01 | Accepted | Phase 1 | Product |
| [0023](0023-word-ranking-core-and-broad-lists.md) | Rank words by agreement across focused GRE lists | 2026-11-01 | Accepted | Phase 1 | Content |
| [0024](0024-vocab-screens-before-all-600-words.md) | Build the vocab screens with 100 words, before writing 600 | 2026-11-01 | Accepted | Phase 1 | Scope |
| [0025](0025-swipe-flashcards-and-mixed-practice.md) | Flashcards are marked by swiping; practice types can be mixed | 2026-11-01 | Accepted; Type-in superseded by 0028 | Phase 1 | Product |
| [0026](0026-write-all-1500-entries-before-launch.md) | Write all 1,500 entries before launch, without sample reviews | 2026-11-01 | Accepted | Phase 1 | Content |
| [0027](0027-fixed-session-size-missed-words-first.md) | Fixed session size, missed words first, and a redo round | 2026-11-01 | Accepted | Phase 1 | Product |
| [0028](0028-remove-type-in-practice.md) | Remove Type-in from vocab practice | 2026-11-01 | Accepted | Phase 1 | Product |
| [0029](0029-sentence-equivalence-hand-checked-pairs.md) | Sentence Equivalence from hand-checked word pairs | 2026-11-01 | Accepted | Phase 1 | Content |
| [0030](0030-full-screen-update-page.md) | A full-screen update page, held during sessions | 2026-11-01 | Accepted | Phase 1 | Product |

## Template

```
# NNNN. Title in plain words
Date · Status (Accepted / Superseded by NNNN / Revisited) · Phase · Type (Product / Technical / Scope / Content)

## Context              what problem or constraint forced a choice
## Options              2–4 real options considered, one line each
## Decision             what we chose
## Trade-offs           what we gave up and why that's acceptable
## Signals to revisit   what evidence would make us change this
```
