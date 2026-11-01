# 0025. Flashcards are marked by swiping; practice types can be mixed
2026-11-01 · Accepted; Type-in superseded by [0028](0028-remove-type-in-practice.md) · Phase 1 · Product

## Context
On staging, Ashwyn asked for Tinder/Quizlet-style marking: swipe right if you knew it, left if not, up if unsure, with a faded red cross or a green tick appearing as you swipe, and the star on the card itself. Also: the card's back should look different from its front, the session size should be a 25–400 dial, and practice types should be a multi-select so one session can mix, say, flashcards and fill-the-blank.

## Options
- Keep three buttons under the card: reliable, but slow for hundreds of cards.
- Swipe only: fast, but no way to mark with a keyboard or without precise gestures.
- Swipe, with the three marks also as small buttons and arrow keys.

## Decision
Swipe plus fallbacks. Right = Know it, left = Review, up = Unsure; tap flips. Marks fade in with the drag and are pinned to the screen edge the card is heading for. The back is ink-blue paper, the cool complement of the warm front. Practice types (Flashcards, Choices, Fill the blank, Type-in) are toggles; a session deals the chosen types evenly across its cards, and Results show flashcard marks and the quiz score separately.

## Trade-offs
- CLAUDE.md keeps `--good` / `--bad` for results screens. The swipe marks use them during a session at the owner's request. They show the user's own mark, not whether an answer was right, so the no-feedback rule still holds.
- Saved single-mode settings upgrade automatically to the multi-select.

## Signals to revisit
- Accidental swipes while scrolling or flipping.
- Mixed sessions feeling choppy rather than varied.
