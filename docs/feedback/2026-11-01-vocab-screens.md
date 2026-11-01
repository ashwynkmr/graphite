# Feedback: first 100 entries and the vocab screens
2026-11-01 · Milestone B, steps 7–8 · Approved on staging

## What was tested
A sample of the entry style in chat, then the first 100 entries (ranks 1–100) in the app on staging: vocab setup, flashcards with swiping, multiple choice, fill-the-blank, type-in, mixed sessions and results. Three staging rounds, reviewed on Ashwyn's phone.

## Feedback (Ashwyn's words, lightly cleaned up)

| ID | Feedback |
| --- | --- |
| FB-34 | Before writing entries: "I wanna see it first." |
| FB-35 | On the sample: "This style works. Let's do it." |
| FB-36 | "Can I first see them in the app?" Then: "Screens first so we get closer to an MVP." |
| FB-37 | The number of cards should be a scale like quant questions, in steps of 25 up to 400. |
| FB-38 | Mark cards by Tinder/Quizlet-style swiping: left = wrong with a faded red cross, right = right with a tick in a green circle, up = unsure. |
| FB-39 | Starring should be a star at the card's top-right corner. |
| FB-40 | The word and its meaning (flipped side) can't share the same design and background; use something complementary. |
| FB-41 | Practice types should be multi-select like difficulty, "cuz maybe I want a mix of fill-the-blank and flashcards". |
| FB-42 | There should be guidance on screen to swipe; the buttons "make this feel like there wouldn't be swiping". Make the buttons more elegant. |
| FB-43 | The unsure swipe should have an icon like wrong and right. |
| FB-44 | Final round approved: log feedback, commit, push, then write ranks 101–600. |

## What changed because of it

| ID | Response | Record |
| --- | --- | --- |
| FB-34 | Showed five sample entries in chat before writing any batch. | — |
| FB-35 | Wrote ranks 1–100 in that style; `validate-words.ts` checks every entry. | — |
| FB-36 | Built the vocab screens with 100 words before writing the rest. | [0024](../decisions/0024-vocab-screens-before-all-600-words.md) |
| FB-37 | Cards dial from 25 to 400 in steps of 25, reusing the quant dial. | [0025](../decisions/0025-swipe-flashcards-and-mixed-practice.md) |
| FB-38 | Swipe right Know it, left Review, up Unsure; faded marks fade in as you drag. | [0025](../decisions/0025-swipe-flashcards-and-mixed-practice.md) |
| FB-39 | Star in the card's top-right corner, also on quiz cards. | — |
| FB-40 | Front is ruled paper; back is a soft ink-blue tint with ink-tinted lines. | — |
| FB-41 | Practice is a multi-select (Flashcards, Choices, Fill the blank, Type-in); types are dealt evenly across the session. | [0025](../decisions/0025-swipe-flashcards-and-mixed-practice.md) |
| FB-42 | First flashcard sways once to show it moves; "Swipe the card, or tap a mark" under it; buttons became small round icon marks with arrow captions. | — |
| FB-43 | Unsure shows a circled question mark in ink blue, below the card. | — |
| FB-44 | Committed and pushed. | — |

## What we deliberately didn't change
- Quiz cards stay unmarked during the session: no right/wrong until results. The red and green marks on flashcards show the user's own mark, not a verdict ([0025](../decisions/0025-swipe-flashcards-and-mixed-practice.md)).
- Not yet checked on a real iPhone beyond Ashwyn's own review.
