# 0021. App icon: a serif lowercase g with a fountain pen on a notebook page
2026-10-31 · Accepted · Phase 1 · Product

## Context
The first icon, a geometric G ring with an ink-blue underline, installed fine, but Ashwyn found it didn't look like an educational app and asked for something "classy but fun" that keeps the G (FB-02). The icon is the first thing either user sees every day on their home screen, so it was worth a few review rounds before launch.

## Options
Each was shown on staging or as a rendered preview:
- **Pencil G:** a G ring whose crossbar is a pencil. Liked the pencil idea.
- **Notebook G:** a graphite G on a ruled page. Liked the notebook.
- **Graduate G:** a G wearing a mortarboard. Not chosen.
- **Hybrid:** pencil crossbar on a spiral notebook (FB-16). Ashwyn wanted the whole G to be the pencil.
- **Cursive pencil G:** one bent pencil (FB-17). "Not looking good."
- **Serif lowercase g:** Newsreader's g on the notebook page, with a pencil or with a fountain pen (FB-18).

## Decision
The serif lowercase **g in ink blue with a black-and-gold fountain pen**, its nib resting on the end of the g's ear, on a ruled spiral-notebook page over an ink-blue ground (FB-19). The g is Newsreader, the app's own serif (SIL OFL), converted to a path so the icon needs no font. `tools/icons/build-g.mjs` generates it and `npm run icons` renders every PNG size.

## Trade-offs
- A fountain pen is less literal for an app called Graphite than a pencil. It reads as more elegant, which is what was asked for, and the ink blue ties it to the app's accent colour.
- The detailed notebook and pen soften at the smallest sizes. Checked at home-screen sizes in previews, though not yet on a real phone.
- Five rounds cost about an hour of build time on launch day, a deliberate spend because it was the owner's top design ask.

## Signals to revisit
- The icon is hard to pick out on either user's home screen.
