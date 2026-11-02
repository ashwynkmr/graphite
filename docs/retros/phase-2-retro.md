# Retro: Phase 2 (first-week depth)
2026-11-01 · `v2.0.0` · Five checkpoints on one branch

## Goal versus what shipped
**Goal:** Sprint, Adaptive, per-topic defaults, Round 2, Browse, mnemonics, a full dashboard, history share, mistake filters and nudges, target Nov 7.

**Shipped on Nov 1, all at once:**
- everything above, with 231 memory aids where about 200 were planned
- a one-time What's New screen, added at Ashwyn's request

**Left out on purpose:** more templates for weak topics. Nobody has results yet to say which topics need them.

**Moved earlier:** personal notes shipped in Phase 1.

## What went well
- **A branch made one launch safe.** Work was backed up and committed as it went, while the live app stayed untouched for two people studying on it ([0042](../decisions/0042-phase-2-on-a-branch-commit-as-we-go.md)).
- **Phone reviews caught what browsers can't.** Ashwyn saw search results missing behind the keyboard, and asked for a dial and stepped chart dragging. None of these showed up in a desktop-sized check.
- **Testing a real update.** An install of the live build, with a paused drill, was updated to the new one. Saved data, the paused drill and every new feature held.
- **Rules beyond the PRD's words.** A sprint's unreached questions would have flooded the mistake log, and a good drill could have jumped two levels. Both came from thinking through the rule, then testing it.

## What was hard
- **Round 2 can't be reviewed yet.** It needs every word seen, so it has only been tested with a seeded deck.
- **A failed check didn't stop a push.** During checkpoint 2, a chained command committed and pushed to the branch after lint failed. Nothing went live, and later commits ran only after every check passed.
- **Mistakes in my own tests.** A stray command hung a run, and two checks failed until the test waited for the screen. Neither was an app problem, but each cost time.
- **"Hardest" had no data.** With no results yet, the memory-aid words were chosen by judgment.

## What I'd do differently
- Gate every commit on its checks from the first one.
- Try each search or input screen with a keyboard-sized viewport.
- Add a way to preview late-stage features on a phone, such as a test deck for Round 2.

## Still open
- Reminders and notes on Android, including the answer buttons.
- A reminder run going over Cloudflare's 10 ms limit and retrying.
- Round 2 on a real phone.
- Whether Adaptive's rule feels right: it needs real study to judge.

## Next bets (only when Ashwyn says go)
- Filling in real numbers on the outcome metrics after Nov 24.
- Templates for whichever topics real results show are weak.
- Phase 3 is optional, and the exam comes first.
