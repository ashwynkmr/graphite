# Feedback: share card
2026-11-03 · After `v3.0.0` · Screenshot and chat

## What was tested
Ashwyn shared a 5-question quant drill from the live app on a phone and sent a screenshot of the share sheet. The card said "0 of 5", while its topic rows added up to 4.

Claude then drew two rounds of row designs with made-up sample scores, and checked the chosen design on quant, vocab and history cards on a computer. A test link was offered for a phone check, and the results screen change was checked by Claude at 375 × 664 px in light and dark, after that link was made.

## Feedback (Ashwyn's words)
Lightly tidied for spelling, as Ashwyn asked for answers to be cleaned up for the docs.

| ID | Feedback |
| --- | --- |
| FB-121 | "I think the results sharing screen is getting populated wrong." |
| FB-122 | "I don't like the slash design also, I don't really know what that means. Replace it with something intuitive. I think that's supposed to show a percentage." |
| FB-123 | "It should show in the order of weakest to strongest." |
| FB-124 | "I like option A. But can there be more fun options that are classroom, study oriented?" Then, of pencil, ruler, highlighter and teacher's pen: "Ruler please." |
| FB-125 | Asked whether the results screen's "By topic" list should match: "Yea." |
| FB-126 | On the phone test and going live: "Rest all is good. Let's push it live when done." |

## What changed because of it

| ID | Response | Record |
| --- | --- | --- |
| FB-121 | Every topic now gets a row, up to 7, then "Other topics", so the rows add up to the score. The copied text matches. | [0056](../decisions/0056-share-card-rows-are-rulers-weakest-first.md) |
| FB-122 | Slashes replaced, with the count and percentage now printed on every row. | [0056](../decisions/0056-share-card-rows-are-rulers-weakest-first.md) |
| FB-123 | Quant rows run weakest to strongest. | [0056](../decisions/0056-share-card-rows-are-rulers-weakest-first.md) |
| FB-124 | Ruler rows on the quant, vocab and history cards. | [0056](../decisions/0056-share-card-rows-are-rulers-weakest-first.md) |
| FB-125 | The results screen uses rulers too, with "By topic" weakest first. | [0056](../decisions/0056-share-card-rows-are-rulers-weakest-first.md) |
| FB-126 | Launched, with no new What's New for this small update. | [0042](../decisions/0042-phase-2-on-a-branch-commit-as-we-go.md) |

## What deliberately didn't change
- The vocab card's order (Know it, Unsure, Review), since those are ratings rather than scores by topic.
- The order of "By difficulty" and "Typed vs multiple choice" on the results screen, which aren't topics.
- The "0 of 5" score itself. Its 6 seconds suggest the questions were tapped through, and no bug in it was reported.

## Not yet known
- Whether Ashwyn opened the test link: "rest all is good" didn't say. The results screen rulers weren't on that link.
- How the ruler looks after a chat app compresses the image.
