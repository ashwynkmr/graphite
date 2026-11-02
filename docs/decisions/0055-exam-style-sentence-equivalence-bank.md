# 0055. An exam-style Sentence Equivalence bank, read by hand
2026-11-01 · Accepted · Phase 3 · Content

## Context
[0029](0029-sentence-equivalence-hand-checked-pairs.md) reused each word's short example sentence, and its options had no decoy pair, because a decoy could also fit such a short sentence. Phase 3 asked for harder, original questions. Ashwyn approved 20 samples (FB-118).

## Options
- Generate sentences and decoys by rule: fast, and can't judge whether a decoy also fits.
- Replace the old questions outright: leaves words with no bank sentence unpractised.
- Write a separate bank by hand, used first, with the old questions as the fallback.

## Decision
A hand-written bank of 294 sentences (`equiv-sentences.json`). Each has a right pair, a decoy pair that doesn't fit, and two spare words, all from the deck, so practice stays on words being studied. A word that is a right answer gets its bank sentence; the other words keep the old question. A session never shows one sentence twice.

`validate-words.ts` checks the deck, parts of speech, blanks, length and listed synonyms. A test can't judge meaning, so every sentence was read; that reading rewrote seven whose decoys could arguably fit. On screens up to 760 px tall the options sit in two columns, because long sentences pushed Submit off a 664 px screen.

## Trade-offs
- 294 is short of the planned 300: about 30 drafts were cut as unfair or lacking a deck word.
- 125 right pairs aren't listed as synonyms in the deck, so they rest on hand reading.
- Only the main word's schedule moves, as before. A sentence can return when its partner comes up in a later session.

## Signals to revisit
- A report that a second pair also fits.
- Two-column options feel cramped on a real phone.
