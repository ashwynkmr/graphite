# 0013. Static React + TypeScript app, IndexedDB via Dexie, hash routing, CI-gated deploys
2026-10-31 · Accepted · Planning · Technical

## Context
Constraints from the product decisions: $0, no server ([0008](0008-no-login-local-progress.md)), GitHub Pages hosting ([0009](0009-pwa-on-github-pages.md)), offline use, a total download under 3 MB, and content that must never ship with a wrong answer key.

## Options
- **Static SPA (Vite + React + TypeScript) with all logic in the browser:** matches every constraint; one stack for app, content scripts and tests.
- **Server-rendered framework:** needs a server or rewrites that GitHub Pages doesn't provide.
- **Plain JavaScript, no framework:** smallest bundle, slower to build several interactive flows in two days.

## Decision
- **Vite 5 + React 18 + TypeScript (strict)**, with CSS Modules and design tokens. Zustand for live session state, Zod schemas shared by content scripts, the app and import.
- **Dexie 4 on IndexedDB** for sessions, attempts, word states, mistakes and settings, with indexed queries for stats, versioned migrations and one JSON export.
- **HashRouter** (`/graphite/#/quant`) so refreshing any screen works on GitHub Pages without server rewrites.
- **vite-plugin-pwa** to precache the app, fonts and content.
- **A pure `src/engine/`** (answer matching, rational math, generators, scheduling) with no React, storage or DOM imports, fully unit-tested.
- **GitHub Actions gates every deploy:** typecheck → lint → tests → content validation → build → publish. A red check leaves the live site unchanged.

## Trade-offs
Hash URLs look less clean. React adds about 55 KB gzipped, which is well inside the 3 MB budget. Client-only storage means no server-side backup. CI adds about 2 minutes per deploy, which is cheap insurance against a broken answer key going live.

## Signals to revisit
- The bundle approaches 3 MB.
- IndexedDB proves unreliable on either user's device.
