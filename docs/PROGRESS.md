# Build log

Running log of what's built, what's live and known issues. Newest first.

## Live now

https://ashwynkmr.github.io/graphite/ shows the app shell: five tabs plus Settings, exam countdown, light/dark themes, installable, offline after first visit.

## Steps

| Step | What | Status | Date |
| --- | --- | --- | --- |
| 1 | Scaffold and deploy an empty shell | Done, awaiting Checkpoint A1 | 2026-10-31 |
| 2 | Engine foundations | Not started | |
| 3 | Generators and question bank | Not started | |
| 4 | Data layer | Not started | |
| 5 | Quant flow + minimal Home | Not started | |

## Notes

### 2026-10-31: Step 1
- Vite 5, React 18, TypeScript strict, HashRouter, vite-plugin-pwa (`registerType: 'prompt'`), Dexie 4 and Zod installed.
- Fonts are self-hosted Latin-only woff2 files (Newsreader 400/500/400 italic, Inter variable), about 120 KB in total. The full Fontsource packages would have put every language subset into the offline precache.
- App icons are drawn by `tools/make-icons.mjs` (no image dependencies); the maskable icon keeps the mark inside the 80% safe zone.
- First production build: 310 KB precache, JS 57 KB gzipped.
- CI runs typecheck → lint → test → content:validate → build → deploy. The content validators are placeholders until steps 3 and 7.

## Known issues
- None yet.
