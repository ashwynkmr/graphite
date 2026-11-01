# 0033. Suggestion rules reach back for answers and use a 90% bar
2026-11-01 · Accepted · Phase 1 · Product

## Context
The PRD picks one Home suggestion by priority. Its weak-topic rule is the lowest accuracy over the last 3 sessions with a topic, with at least 10 answers. Testing the built app found the card never appeared. A 20-question mixed drill gives each of the 9 topics about 2 answers, so 3 drills give about 7. The slow-topic rule also needs each question's target time, which means loading the question bank on Home.

## Options
- Keep the PRD rule, and accept that Quick drill users never see the card.
- Lower the minimum to 5 answers, which makes one bad answer swing the result.
- Keep the minimum and reach further back until a topic has 10 answers.

## Decision
Reach back: use the last 3 drills that included the topic, plus older ones until it has 10 answers. Only normal drills count, because retries and mistake drills are made of past misses and would skew accuracy.

Two additions. A topic at 90% or above is never called weak, even if it is the lowest, matching the PRD's accuracy target. A topic is slow when at least half its correct answers carry the existing slow flag, so Home needn't load the bank. The paused-drill priority is the existing resume banner.

## Trade-offs
- "Weakest last time" can describe several sessions when drills are mixed.
- Slow flags trigger at 1.5 × target time, so this is stricter than the PRD's average over target.

## Signals to revisit
- The card names a topic that doesn't feel weak.
- The slow suggestion never appears during real use.
