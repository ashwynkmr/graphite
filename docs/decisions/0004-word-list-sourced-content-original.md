# 0004. Word list from public frequency lists; all meanings and sentences original
2026-10-31 · Accepted · Planning · Content

## Context
The vocab deck should match the words that actually show up on the GRE. Several publishers and communities publish high-frequency lists. Individual words aren't copyrightable, but a book's definitions, example sentences and mnemonics are, and this repo is public.

## Options
- **Use one publisher's full deck (words + definitions):** fastest, and a clear copyright problem.
- **Rank words across several public lists; write all entry text fresh:** legally clean, more writing effort.
- **Use a public-domain dictionary for meanings:** clean, but dated and too long for a one-line flashcard.

## Decision
Collect several public high-frequency GRE word lists as plain word lists (words only), rank words by how many lists include them, and take the top 1,500 in three tiers of 500. Every meaning, example sentence, synonym set and mnemonic is written fresh for Graphite and checked by `validate-words.ts` (the sentence contains the word, the meaning is 90 characters or less and doesn't use the headword, and so on).

## Trade-offs
Writing 1,500 original entries is the largest content job in the project and the main reason vocab launches with 600 words ([0011](0011-launch-with-600-words.md)). Original sentences are also unproven: they need a manual 10% sample review per batch to catch awkward or misleading examples.

## Signals to revisit
- Review samples show frequent meaning errors or unnatural sentences.
- A takedown or copyright concern is raised about any entry.
