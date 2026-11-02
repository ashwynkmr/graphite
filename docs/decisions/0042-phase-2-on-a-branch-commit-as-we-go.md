# 0042. Phase 2 is built on a branch, committed as it goes, and launched once
2026-11-01 · Accepted · Phase 2 · Scope

## Context
Ashwyn asked to keep committing during Phase 2 but put nothing live until the whole phase is done (FB-94), and for the launch to tell users what's new. Until now, nothing was committed before approval on staging ([0016](0016-review-gate-staging-before-commit.md)), and every push to `main` deployed. Both users are studying on the live app until Nov 24.

## Options
- Commit on `main` without pushing: simple, but the work lives only on one Mac, one push releases it all, and a live bug can't be fixed alone.
- A `phase-2` branch, pushed to GitHub: backed up and out of the deploy path. The code is visible in the public repo.
- Keep the old gate: nothing committed until approved, so larger uncommitted batches.

## Decision
A `phase-2` branch, pushed for backup. Work is committed once its checks pass. Ashwyn still reviews each checkpoint on staging, and changes from that review are follow-up commits. Launch is merging into `main`, which only Ashwyn approves. Fixes to the live app go on `main` directly and are merged into the branch.

## Trade-offs
- The branch's commits can include work Ashwyn later changes, so history shows the back-and-forth.
- Deploy checks don't run on the branch, so they all run locally before each commit.
- Users wait until the end for everything, rather than getting pieces during the first week as the PRD planned.

## Signals to revisit
- The branch drifts far from `main` through live fixes.
- A finished feature would help study now, and Ashwyn wants it sooner.
