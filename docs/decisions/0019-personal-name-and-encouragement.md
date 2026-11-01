# 0019. Ask for a name and use it for encouragement, on the device only
2026-10-31 · Superseded by [0020](0020-name-only-encouragement.md) (cheer word removed; the rest still applies) · Phase 1 · Product

## Context
Ashwyn asked for the app to ask for the user's name, remember it after the app is closed, and use it to personalise screens and encouragement, for example "<name>, you got this" plus a motivational line (FB-11). There are no accounts ([0008](0008-no-login-local-progress.md)) and two users, so the name has to live on each device. The example phrasing was gendered ("you're the girl"), and the app shouldn't guess either user's gender.

## Options
- **No personalisation:** simplest, ignores the request.
- **Name only, neutral messages:** personal and safe, but loses the playful tone Ashwyn asked for.
- **Name plus an optional "cheer word" the user picks** (girl, champ, legend, or none): personal and playful, and nobody's identity is assumed.

## Decision
- **First run:** a one-screen prompt asks for a first name, with an optional cheer word.
- **Storage:** both are kept in the on-device database (`meta`) and included in Export. Both can be changed in Settings.
- **Where messages appear:** Home shows a greeting and a short motivational line; Results shows encouragement sized to the score ("Ashwyn, 18 of 20. That's the pace.").
- **Where they don't:** never during a session, so results-only-at-the-end ([0007](0007-results-only-at-end.md)) holds, and no message hints at right or wrong.
- **Writing:** all lines are original, short and tied to studying. No quotes from books or famous people, to avoid copyright and cliché.

## Trade-offs
More copy to write and keep tasteful. A cheesy line on a bad day could grate, so lines for low scores focus on effort and the next step, not praise.

## Signals to revisit
- Either user finds the messages repetitive or skips the name prompt.
