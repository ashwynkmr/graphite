# Feedback: vocab difficulty
2026-11-07 · After `v3.0.0` · Chat, with example questions

## What was tested
Ashwyn passed on feedback from use. Claude showed example questions from real deck words, side by side, and Ashwyn chose between them. Claude then built the choice and checked it on a computer at 375 px: the setup screen, a "Closest in meaning?" question, Easy and Hard fill the blank, results and the share card. It hasn't yet been checked on a real phone.

## Feedback (Ashwyn's words)
Lightly tidied for spelling, as Ashwyn asked for answers to be cleaned up for the docs.

| ID | Feedback |
| --- | --- |
| FB-133 | "I need a difficulty selector for vocab as well, because the user feedback was that they need hard questions also when they see question types that are not just flashcards. Then flow that into results statistics and share card wherever applicable." |
| FB-134 | Of "Exam-style" and "Same questions, harder options", chose "Exam-style". |
| FB-135 | Of a selector with or without Adaptive, chose "Easy, Medium, Hard + Adaptive". |

## What changed because of it

| ID | Response | Record |
| --- | --- | --- |
| FB-133 | A Difficulty picker on the vocab setup screen, "By difficulty" on results, and share card rows by difficulty. | [0058](../decisions/0058-vocab-difficulty-levels.md) |
| FB-134 | Hard asks "Closest in meaning?" and uses exam-style sentences with trap words. | [0058](../decisions/0058-vocab-difficulty-levels.md) |
| FB-135 | Adaptive asks each word by how well it is known. | [0058](../decisions/0058-vocab-difficulty-levels.md) |

## What deliberately didn't change
- Flashcards, which are the same at every level.
- Which words a session shows: the deck still decides that.
- Medium, which asks exactly as before, and is the default.
- The Progress report card, whose Verbal column counts words rather than quiz scores.

## Not yet known
- Whether Hard feels hard enough on a real phone.
