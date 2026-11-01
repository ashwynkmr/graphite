# Graphite: rules for Claude Code

Graphite is a free, offline-first GRE prep PWA (mental-math drills + GRE vocab) for two users, hosted at https://ashwynkmr.github.io/graphite/. Exam date: Nov 24, 2026.

## Source of truth

- Read `docs/product/PRD.md` (what) and `docs/product/TRD.md` (how) before starting a step.
- If the PRD and TRD conflict, follow the TRD and flag it. The owner's instructions override both.
- Build one step at a time and stop at each checkpoint. Phase 1 only until the owner says otherwise.
- **Review gate ([0016](docs/decisions/0016-review-gate-staging-before-commit.md)):** at each checkpoint, serve the production build on an HTTPS staging tunnel (`npm run staging`), summarise, and wait. Do not commit or push anything until the owner approves that checkpoint on staging.
- Current status lives in `docs/PROGRESS.md`. Plan and phase status live in `docs/product/ROADMAP.md`.

## Non-negotiables

- **No right/wrong feedback during any session.** Results appear only on the results screen.
- **Never type a quant answer by hand.** Every answer is computed by a template or by the hand-written evaluator, and checked by `validate-bank.ts`.
- **Original vocab content only.** Only the word list may come from outside sources. Meanings, sentences, synonyms and mnemonics are written fresh, never copied from Barron's, Magoosh, Manhattan, ETS, dictionaries or anywhere else.
- `src/engine/` stays pure: no React, Dexie or DOM imports. Every change there ships with unit tests.
- Run `npm test` and `npm run content:validate` before every commit. Never commit content that fails validation; never push red.
- **Offline-first:** after the first visit every Phase 1 feature works with no network. No runtime network calls, analytics, trackers or third-party scripts. One exception ([0037](docs/decisions/0037-push-reminders-with-on-device-text.md)): opt-in reminders send a push address and wake-up times to `push-server/`, and studying must never depend on them.
- Progress lives only in IndexedDB on the device. Nothing leaves it except via Share or Export; reminders never send results.
- **Mobile-first:** check every screen at 375 px wide first. Tap targets ≥ 48 px. Thumb-reachable keypad. Respect iPhone safe areas.
- Use only tokens from `src/styles/tokens.css`. No emoji, no gamified clutter, no sounds.
- Keep total download under 3 MB.

## Look and feel

Minimal, elegant, study-desk: warm paper background, graphite text, one ink-blue accent, serif (Newsreader) for words and headings, Inter with tabular numbers for UI, faint ruled lines on cards, index-card flashcards, pencil-tick marks on results. `--good` / `--bad` colours only on results screens.

## Commands

- `npm run dev` / `npm run build` / `npm run preview`
- `npm run typecheck` · `npm run lint` · `npm test` · `npm run content:validate`
- CI (`.github/workflows/deploy.yml`) runs typecheck → lint → test → content:validate → build → server checks → deploy on every push to `main`.
- `push-server/` is the reminder server, with its own `package.json`. It deploys separately: see its README.

## Documentation rules (this repo is also a PM case study)

- Every meaningful product or technical choice gets a decision record in `docs/decisions/NNNN-short-title.md` (template in `docs/decisions/README.md`), 150–300 words, and a row in the index.
- When a decision changes, never edit history: mark the old record **Superseded by NNNN** and write a new one explaining what was learned.
- At each checkpoint, ask the owner 3–5 short questions and record the answers in `docs/feedback/YYYY-MM-DD-<checkpoint>.md` (what was tested, feedback in their words, what changed and what deliberately didn't). Give every item an ID (FB-NN) and track it in the table in `docs/feedback/README.md` until it's Done or No change.
- At the end of each milestone: update `docs/CHANGELOG.md`, `docs/product/ROADMAP.md`, `docs/PROGRESS.md`, write a retro in `docs/retros/`, tag a release (`v0.1.0` A, `v0.2.0` B, `v1.0.0` Phase 1) and publish a GitHub Release.
- Keep `README.md` current after every milestone.
- **Never invent feedback, quotes, users, metrics or results.** Unknown means "not yet known" or a target.
- Specific over generic. No buzzwords. Decision records under 300 words, retros under 500.
- Public repo: no personal details beyond the owner's first name (Ashwyn) and GitHub handle. The study partner is "a second user".
- Conventional Commits: `feat:`, `fix:`, `docs:`, `content:`, `chore:`, `test:`, `ci:`.
