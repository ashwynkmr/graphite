# Feedback: share card
2026-11-03 · After `v3.0.0` · Screenshot and chat

## What was tested
Ashwyn shared a 5-question quant drill from the live app on a phone and sent a screenshot of the share sheet. The card said "0 of 5", while its topic rows added up to 4.

Claude then drew two rounds of row designs with made-up sample scores, and checked the chosen design on quant, vocab and history cards on a computer. The new card hasn't yet been checked on a real phone or sent through a chat app.

## Feedback (Ashwyn's words)
Lightly tidied for spelling, as Ashwyn asked for answers to be cleaned up for the docs.

| ID | Feedback |
| --- | --- |
| FB-121 | "I think the results sharing screen is getting populated wrong." |
| FB-122 | "I don't like the slash design also, I don't really know what that means. Replace it with something intuitive. I think that's supposed to show a percentage." |
| FB-123 | "It should show in the order of weakest to strongest." |
| FB-124 | "I like option A. But can there be more fun options that are classroom, study oriented?" Then, of pencil, ruler, highlighter and teacher's pen: "Ruler please." |

## What changed because of it

| ID | Response | Record |
| --- | --- | --- |
| FB-121 | Every topic now gets a row, up to 7, then "Other topics", so the rows add up to the score. The copied text matches. | [0056](../decisions/0056-share-card-rows-are-rulers-weakest-first.md) |
| FB-122 | Slashes replaced, with the count and percentage now printed on every row. | [0056](../decisions/0056-share-card-rows-are-rulers-weakest-first.md) |
| FB-123 | Quant rows run weakest to strongest. | [0056](../decisions/0056-share-card-rows-are-rulers-weakest-first.md) |
| FB-124 | Ruler rows on the quant, vocab and history cards. | [0056](../decisions/0056-share-card-rows-are-rulers-weakest-first.md) |

## What deliberately didn't change
- The vocab card's order (Know it, Unsure, Review), since those are ratings rather than scores by topic.
- The results screen's own "By topic" list, as the request was about the share card.
- The "0 of 5" score itself. Its 6 seconds suggest the questions were tapped through, but this isn't confirmed.

## Not yet known
- How the ruler looks on a real phone, and after a chat app compresses the image.
