# 0051. Five new quant subjects join the nine topics
2026-11-01 · Accepted · Phase 3 · Content

## Context
Ashwyn asked to expand the question bank and improve its quality (FB-110). An audit of the 1,500 questions found no exact repeats, and drills already generate fresh questions when a topic runs low, so more of the same numbers wouldn't help. The gaps were elsewhere. A keyword search found no probability, counting, median or range questions, and only about 8 on remainders, 17 on algebra and 20 on geometry.

## Options
- More templates in the nine current topics only: keeps to mental math, leaves the gaps.
- Add subjects, sized for working in the head: fills the gaps, and widens the product past mental math.
- Full exam prep: proofs and long algebra stay a PRD non-goal.

## Decision
Add Number properties, Statistics, Probability, Algebra and Geometry as topics of their own, included in Mixed. Geometry is told in words, with no diagrams. Answers are computed by templates, and unit tests work them out a second way, by brute force, so a wrong shortcut can't pass by agreeing with itself.

New topics are added after the first nine, and existing templates' quotas stay put. The first checkpoint's rebuild left all 1,500 existing questions byte-for-byte unchanged, so saved progress and mistake logs still point at the same questions.

## Trade-offs
- The PRD's scope widens, and Mixed drills now include subjects some users may not want.
- Fourteen topic chips make the setup screen longer.
- A person still has to read samples: testing passed a broken sentence that reading caught.

## Signals to revisit
- Reports of unfair or too-hard questions in the new topics.
- Real results show the new subjects crowding out arithmetic speed.
