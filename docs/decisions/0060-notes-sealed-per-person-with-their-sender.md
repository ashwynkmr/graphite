# 0060. Notes are sealed per person, each with its own sender
2026-11-07 · Accepted · Post-launch · Product

## Context
Personal notes ([0041](0041-personal-notes-sealed-in-the-app.md)) went to a second user, from Ashwyn, in one sealed set that several names could open. Ashwyn asked for the same notes to reach him when his saved name is Ashwyn, but from the second user: same frequency and rules (FB-139). The sender's name was written into the app in three places, so it couldn't change.

## Decision
- The sealed file holds a list of sets. Each set has its own notes, its own names and its own sender, sealed together, so the sender's name stays out of the repo like the text does.
- A name opens at most one set. The sealing tool refuses two sets that share a name.
- The sender replaces the hard-coded name in the notification title, the nightly question and the Settings line.
- Schedule, nightly question, opt-out and reminders are unchanged, since they only ask whether a set opened.
- The private folder is now one folder per set under `private/sets/`.

## Trade-offs
- A name unlocks a set, and the owner's first name is public in this repo. So his set opens only for the name saved with a full stop after it, which strangers wouldn't try first. That is a small extra step, not a secret: anyone who thinks to add the full stop can open that set by running the app's code (FB-140).
- The full stop is dropped wherever the name is shown in a sentence.
- A set takes a second encrypted copy of its notes, so the file roughly doubles.

## Signals to revisit
- If the notes should be properly private, they need more than the name, such as a short code typed once on the owner's phone.
