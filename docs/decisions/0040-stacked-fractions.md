# 0040. Fractions are stacked and powers are raised, on screen only
2026-11-01 · Accepted · Phase 1 · Design

## Context
Ashwyn reported that mixed fractions read badly: 1 1/4 looks like 11/4. In the bank, 29 prompts have mixed numbers, about 190 have plain fractions and 318 shortcuts contain them. Powers such as 16^(−3/2) also read like code. Options were compared side by side (`docs/feedback/assets/2026-11-01-fraction-options.png`).

## Options
- A wider gap after the whole number: smallest change, still looks typed.
- Small slanted fractions: compact, but large ones like 84/25 get hard to read.
- Stacked fractions, one number above the other, as in a textbook.

## Decision
Stacked, with raised powers, on prompts, choices, answers and shortcuts. A `MathText` component draws them from the existing text, so the bank, question IDs and saved progress don't change. Decimals over a number (12.5/100) and units ($12/kg, km/h) stay as written. Screen readers hear "1 and 1 over 4". On the ruled question card, fractions overhang slightly so text stays on its lines.

Typing is unchanged: answers are still entered as 5/4, because the keypad has no way to enter a mixed number.

## Trade-offs
- Lines with fractions are a little taller on Results and in the Mistake log.
- Fractions in small shortcut text are tight to read; a size floor keeps them legible.
- The share image and text stay plain.

## Signals to revisit
- Stacked text is hard to read on a small real phone. Not yet checked on one.
- A bank number is mistaken for a fraction or a whole number.
