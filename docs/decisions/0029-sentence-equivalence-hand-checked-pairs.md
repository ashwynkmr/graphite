# 0029. Sentence Equivalence from hand-checked word pairs
2026-11-01 · Accepted · Phase 1 · Content

## Context
Removing Type-in left a gap in Practice, and Ashwyn asked to fill it with Sentence Equivalence (FB-56): one sentence, one blank, six words, and two must give the same meaning. A wrong answer key would teach a wrong meaning, and a listed synonym doesn't always fit a given sentence.

## Options
- Generate pairs from any synonym in the deck: full coverage, unreliable answers.
- Write a new bank with exam-style sentences: best quality, too slow for this release.
- Reuse each word's example sentence and hand-check one partner per sentence.

## Decision
Hand-check. Of 764 words with a synonym in the deck, 661 kept a partner that fits their sentence (`equivalent` in `words.json`). `validate-words.ts` requires the partner to be in the deck, share the part of speech and be a listed synonym. Only the exact pair scores, as on the exam, and only the main word's schedule moves.

Four wrong options come from look-alikes, then other words, never a synonym of the pair or of each other. Options are in base form, and "a(n)" hides the article clue. Words without a partner are asked another chosen way.

## Trade-offs
- Easier than the exam: one synonym pair, no decoy pair, short sentences. On these sentences a decoy pair could also fit, leaving two right answers.
- Wrong options are chosen by rule, so one can fit loosely. Only the right pairs are hand-checked.

## Signals to revisit
- Questions feel too easy: write an exam-style bank with decoy pairs.
- Reports of unfair options: add exclusions.
