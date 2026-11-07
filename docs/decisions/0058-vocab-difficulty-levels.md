# 0058. Vocab quiz cards get Easy, Medium, Hard and Adaptive
2026-11-07 · Accepted · Post-launch · Product

## Context
Ashwyn passed on feedback that vocab needs hard questions for the practice types other than flashcards (FB-133). Every vocab quiz card was asked one way, while quant had Easy, Medium, Hard and Adaptive. Word tiers measure frequency, not difficulty, and the deck already decides which words come up.

## Options
- Harder words: would fight the Leitner schedule.
- Same question shapes, harder wrong options only.
- Exam-style Hard: new question shapes and wrong options built to tempt.

## Decision
Ashwyn chose exam-style Hard (FB-134) and Adaptive (FB-135). Difficulty changes how a card is asked, never which words. Flashcards are the same at every level, so the picker shows only when another practice type is on.

- **Easy:** Choices asks word → meaning; wrong options come from other parts of speech. Sentence equivalence uses the word's own sentence first.
- **Medium:** the way every card was asked before, kept exactly.
- **Hard:** Choices asks "Closest in meaning?" when the word has a synonym in the deck (764 words), else meaning → word. Fill the blank uses an unused exam-style sentence with its trap pair (582 words), else the usual sentence.
- **Adaptive:** each word by its box: new or missed words easy, words known well hard.

Results and the vocab share card show quiz cards by difficulty; the card's rows add up to the score.

## Trade-offs
- Sentence equivalence Hard is the same as Medium, which already uses the exam-style sentences first.
- Closest in meaning has one right answer only by the synonym lists; a near-synonym nobody listed could still tempt fairly.
- In a mixed session, the share card's quiz rows replace the flashcard marks.

## Signals to revisit
- Hard accuracy close to Medium would mean Hard isn't harder.
