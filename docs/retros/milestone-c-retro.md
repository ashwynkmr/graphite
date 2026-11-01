# Retro: Milestone C (rest of Phase 1)
2026-11-01 · `v1.0.0` · Steps 9–11

## Goal versus what shipped
**Goal:** a mistake log, a fuller Home, Progress, Settings with a two-level reset, Share, about 300 hand-written problems and a launch pass.

**Shipped on Nov 1:**
- everything above, taking the bank to 1,500 questions
- Report a problem, which an audit found had never been built
- 12 browser run-throughs before every deploy

**Added along the way, at Ashwyn's request:**
- usage-based push reminders ([0037](../decisions/0037-push-reminders-with-on-device-text.md)), reversing an in-app-only decision made the same day
- stacked fractions and raised powers ([0040](../decisions/0040-stacked-fractions.md))
- personal notes for the second user, moved up from Phase 2 ([0041](../decisions/0041-personal-notes-sealed-in-the-app.md))

## What went well
- **Formulas for hand-written problems.** Each answer is worked out by code ([0039](../decisions/0039-handwritten-problems-from-formulas.md)). The validator caught a formula giving 35 instead of 31.
- **Reading as well as validating.** Reading all 300 problems caught drafting left in prompts and Easy problems that were too gentle, which no check could find.
- **Sealing the notes.** Private text ships in a public repo without being readable there, and any other name gets normal reminders.
- **Testing a real update.** An install of the old live build was updated to the new one. Saved data stayed, and only a matching name got notes.

## What was hard
- **A planned feature was missing.** Report a problem wasn't built until the launch audit found it. The audit should have come earlier.
- **A hasty test blocked a release.** A run-through reloaded the page right after a tap, before the answer had saved. It passed on the Mac and failed on the deploy machine, so the first notes push didn't go live. The app was fine; the test needed to wait for the next question.
- **A running test link isn't a current one.** The staging link was up but serving a build older than the code.
- **Phones limit what a web app can do.** iPhones can't show answer buttons on a web app's notification, so the nightly question has to open the app. Ashwyn asked for buttons and kept it as is after hearing why.

## What I'd do differently
- Compare the plan with the build at each milestone, not only at launch.
- Check platform limits before designing a touch point, not after it's been tested.
- Rebuild the staging link at the start of each review, whether or not it looks alive.

## Still open
- Reminders and notes on Android, including the answer buttons.
- A reminder run going over Cloudflare's 10 ms limit and retrying.
- Flashcard marks use red and green during a session, against the rule keeping those colours to results. Left as is, and Ashwyn was told.

## Next bets (Phase 2, only when Ashwyn says go)
- Sprint mode and Adaptive difficulty.
- Round 2, Browse and search.
- A full dashboard, with real study data to show.
