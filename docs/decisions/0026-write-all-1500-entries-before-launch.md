# 0026. Write all 1,500 entries before launch, without sample reviews
2026-11-01 · Accepted · Phase 1 · Content

## Context
The plan (TRD step 7, [0023](0023-word-ranking-core-and-broad-lists.md)) was to launch Milestone B with ranks 1–600 and write the rest later, showing Ashwyn 20 random entries per batch at Checkpoint B1. After approving the style on ranks 1–200, Ashwyn said not to show sample entries any more and to "do it for all words".

## Options
- Keep the plan: write ranks 201–600 with a sample checkpoint per batch, and leave 601–1,500 for later.
- Write all 1,500 in batches of 100 now, each one checked by `validate-words.ts` but not reviewed in chat.

## Decision
All 1,500 entries are written. Each batch passed the validator before it was committed: the meaning doesn't use the headword, the example contains the word, three look-alikes from the deck with the same part of speech, and no look-alike that is also a synonym. Two duplicate meanings found in a final audit (aberrant/anomalous, penury/indigence) were reworded.

The validator gained one exception. The deck has only three adverbs (abreast, askance, respectively), too few to give each one three adverb look-alikes, so adverbs may borrow look-alikes from other parts of speech.

## Trade-offs
- About 1,300 entries had no human review before going live. The validator catches structural slips but not a weak sentence or a misleading look-alike.
- An adverb's multiple-choice options can include words of another part of speech, which slightly weakens those three questions.

## Signals to revisit
- Either user flags entries that are wrong or confusing in use. Fix them in `content/words.json` and log them as feedback.
