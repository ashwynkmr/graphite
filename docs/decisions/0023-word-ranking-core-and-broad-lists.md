# 0023. Rank words by agreement across focused GRE lists
2026-11-01 · Accepted · Phase 1 · Content

## Context
The deck is the 1,500 most frequent GRE words (PRD). The TRD's rule was +1 per list plus a bonus for ranking near the top of a list. None of the GRE lists found is ordered by frequency, and they range from 274 to about 5,000 words. Counting a 5,000-word dump like a curated 300-word list would reward obscure words.

## Options
- Equal weight for every list: big lists drown out the curated ones.
- Only the curated lists: 1,112 words appear on two or more, so the last ~400 places would be arbitrary.
- Curated lists count fully; big lists only break ties.

## Decision
Seven focused GRE lists (GregMat, Magoosh 1,000, Manhattan 1,000, PowerScore, Greenlight, PrepScholar, Barron's 333) score 1 each. Five broad lists (Vocabulary.com Top 1000, GRE 3000+, Barron's ~4,700 and two 5,000-word lists) add 0.1 each, so together they can never outweigh one more focused list. A word must be on at least one focused list. Remaining ties use a fixed hash order, not the alphabet. Inflections merge into the base word via `aliases.txt`, except forms tested as their own adjectives (arresting, disinterested and five more), which Ashwyn chose to keep separate. Magoosh's Basic/Common/Advanced split is left out: it repeats the Magoosh 1,000.

## Trade-offs
- The deck reflects list makers' consensus, not measured exam frequency; no public source has that.
- Raw lists are committed with their origins credited. They hold words only, which are not protected; the collection we took them from has no licence.

## Signals to revisit
- Words in tier 1 that feel too easy or too rare during study.
- A frequency-ordered list from real exam material becomes available.
