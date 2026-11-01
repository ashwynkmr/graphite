# 0024. Build the vocab screens with 100 words, before writing 600
2026-11-01 · Accepted · Phase 1 · Scope

## Context
The plan (TRD build order, step 7 then 8) was to write entries for ranks 1–600 and only then build the vocab screens. After approving the first 100 entries, Ashwyn asked to see them in the app first, "so we get closer to an MVP".

## Options
- Keep the order: 500 more entries before anything is visible.
- Build the screens now on the 100 written words, then write ranks 101–600 in batches.

## Decision
Screens first. Setup, sessions and results ship on the 100 written words; the deck grows as each batch lands, with no code change. Rules settled while building:
- Only a flashcard marked Review comes back later in the same session (once). A missed multiple-choice or type-in word does not, because seeing it again would reveal it was wrong; it is due tomorrow in box 1 instead.
- A wrong option is never a synonym of the word, in either direction. Testing found "taciturn" offered against "reticent", a second right answer. The picker and `validate-words.ts` both enforce this now.
- Fill-the-blank works for every word. When the sentence uses another form (enervated, platitudes), all five options are base forms of the same part of speech, so grammar gives nothing away; the card says so.

## Trade-offs
- With 100 words, the New deck runs out on day one at the 200-a-day goal. Ranks 101–600 are next, so this lasts a day or two.
- Checkpoint B1 (20 random entries from 600) moves after B2.

## Signals to revisit
- Entry-style feedback from real use that would change how ranks 101–600 are written.
