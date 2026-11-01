# 0020. Encouragement uses the name only; no cheer word
2026-10-31 · Accepted · Phase 1 · Product · Supersedes [0019](0019-personal-name-and-encouragement.md) (cheer word only)

## Context
[0019](0019-personal-name-and-encouragement.md) added a name prompt plus an optional "cheer word" (girl, champ, legend), so the playful tone of Ashwyn's example could be offered without guessing anyone's gender. After using it on staging, Ashwyn asked to drop the cheer-word question and personalise all motivation with the name alone (FB-14).

## Options
- **Keep the optional cheer word:** more playful, but one more question on the first screen that Ashwyn doesn't want.
- **Name only:** one question, no identity assumptions, simpler copy.
- **Name plus a free-text nickname:** flexible, but the same extra step.

## Decision
Name only. The first-run screen asks one thing: a first name. Every greeting and encouragement line uses the name. The cheer word is removed from the profile, Settings and all copy. Everything else in 0019 still holds: on-device storage, included in Export, editable in Settings, shown on Home and Results only and never mid-session, all lines original.

## Trade-offs
Slightly less playful copy. That's acceptable: the name already makes lines personal, and the first-run screen is now a single field. Profiles saved with a cheer word on staging simply ignore it.

## Signals to revisit
- Either user asks for a nickname or a different tone.
