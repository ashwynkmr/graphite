# Feedback: step 6, ranked word list
2026-11-01 · Milestone B, step 6 · Uncommitted until approved

## What was tested
No app change. Ashwyn reviewed the sources, the scoring method and the top 100 of the ranked deck (`content/ranked-words.json`) in chat.

## Feedback (Ashwyn's words, lightly cleaned up)

| ID | Feedback |
| --- | --- |
| FB-30 | On the top 100: "Honestly could not tell, use your own judgement there." |
| FB-31 | Happy with the source mix, "but there should be 1,500 words or so, right? Or do you suggest fewer?" |
| FB-32 | Inflected adjectives (arresting, disinterested and the rest): keep them separate. |
| FB-33 | Raw lists in the public repo: "As you recommended" (commit them, sources credited). |

## What changed because of it

| ID | Response | Record |
| --- | --- | --- |
| FB-30 | Kept as ranked. The top 100 are all words on five or more focused lists. If a word feels too easy or too rare during study, it can be dropped or merged in `aliases.txt` and the ranking rerun. | [0023](../decisions/0023-word-ranking-core-and-broad-lists.md) |
| FB-31 | Kept at 1,500. At 200 new words a day the deck is first seen by about Nov 8, leaving about two weeks of review before Nov 24. Launch still starts with ranks 1–600. | — |
| FB-32 | Seven forms stay as their own words: affected, arresting, contrived, daunting, discerning, disinterested, harrowing. | [0023](../decisions/0023-word-ranking-core-and-broad-lists.md) |
| FB-33 | Raw lists committed in `content/sources/wordlists/`, each with its origin in `sources.json`. | [0023](../decisions/0023-word-ranking-core-and-broad-lists.md) |

## What we deliberately didn't change
- No hand reordering of the top 100; the ranking stays reproducible from the lists.
