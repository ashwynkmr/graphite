# Retro: Milestone A (quant drills live)
2026-10-31 · `v0.1.0` · Steps 1–5

## Goal versus what shipped
**Goal:** a usable mental-math drill on the phone by Nov 1, the first study day.

**Shipped on Oct 31:**
- an installable, offline app
- a 1,200-question bank at a difficulty Ashwyn asked to raise
- drills with a topic and difficulty picker, autosave and resume
- results with breakdowns, a review list and Retry wrong ones
- a first-run name prompt with name-based encouragement
- a new icon

**Not in Milestone A**, as planned: vocab, the Mistakes screen, Progress, Settings beyond the name, Share and the hand-written word problems. That's Milestones B and C.

## What went well
- **Code-computed answers paid off.** Every answer comes from a template and is rebuilt from its seed in CI, and no answer-key error has been reported so far. The property test (every template × difficulty × 200 seeds) caught dozens of edge cases before any human saw them.
- **Fast feedback loops.** Each checkpoint turned owner comments into tracked items (FB-01 to FB-21) and, where a choice changed, decision records (0016–0021). The difficulty recalibration (0017) and the distractor rule (0018) came from one 30-question review.
- **Testing through the staging URL** found the real cause of "the multi-select doesn't work": a stale build plus an ambiguous control. The logic was fine.

## What was hard
- **Tests miss content quality.** Printed samples, not tests, caught:
  - an explanation that used a reduced denominator (3/500 instead of 6/1,000), so its arithmetic was wrong
  - a nonsense option ("1013")
  - an unrealistic scenario ("a team played 1,600 games")
  - "112.5% of parts failed inspection"
  - an ambiguous "closest power of ten"

  Reading samples by eye is now part of every content change.
- **Raising difficulty meant rewriting all 73 templates** on launch day. It was the right call, since Easy wasn't worth study time, but it took the largest single block of time.
- **The review gate arrived mid-milestone.** Steps 1–3 went straight to live; from A3 onwards nothing was committed before approval on staging. That made later reviews safer, but left one large uncommitted batch, split into focused commits at the end.
- **Design by iteration.** The icon took five rounds (0021), each cheap to produce but a round trip with the owner.
- **Service-worker updates.** A cached build hid new work during review. The update bar now shows on every tab screen.

## What I'd do differently
- Agree on the review gate and staging setup at kickoff, not after two checkpoints.
- Show a small sample of questions at every difficulty before writing all the templates, so calibration feedback comes first.
- For visual work, show two or three directions side by side from the start rather than one at a time.

## Next bets (Milestone B)
- A ranked list of the top 1,500 GRE words from several public lists (words only), shown to Ashwyn before writing.
- Original entries for ranks 1–600 in batches of 100, each with a 10% sample review.
- Vocab flashcards, multiple choice and type-in, with Leitner scheduling and the 200-new-words-a-day cap.
