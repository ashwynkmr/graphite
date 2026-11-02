# 0044. How Round 2, Browse and memory aids work
2026-11-01 · Accepted · Phase 2 · Product

## Context
At 200 new words a day, the deck runs out within 8 days, before the Nov 24 exam, so the app needs something after the first pass. The PRD asks for Round 2, a searchable list and mnemonics for the "hardest ~200 words", but no study data says which words are hardest yet.

## Options
- **Round 2:** replace the Today deck once the first pass ends, or add a separate deck beside it.
- **Hardest words:** wait for real results, use the lowest-ranked words, or choose by judgment now.
- **Browse:** count looking a word up as study, or leave its schedule alone.

## Decision
- **Round 2:** a separate deck, offered once on Home when every word has been seen, and always available in Vocab. Due reviews carry on in Today. Words go weakest first: starred, then box 1 up to retired. Answers change boxes as usual. Rounds repeat until the exam.
- **Memory aids:** 231 written fresh, chosen by judgment across all tiers as the words hardest to decode from their parts. Each is one sentence of 90 characters or less, shown on the flashcard's back and in Browse. Latin and French origins were included only where true.
- **Browse:** search by word, synonym or meaning; filter by frequency, stage or star. Looking up never changes a word's box.

## Trade-offs
- Chosen by judgment, so the aids may miss the words these two users find hardest.
- Sound-alike hooks can be silly, and that is partly why they stick.
- Two decks can show a word twice in a day.

## Signals to revisit
- Real results show hard words without aids.
- Round 2 feels like too much on top of Today.
