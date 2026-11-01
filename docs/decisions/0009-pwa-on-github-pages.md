# 0009. PWA on free GitHub Pages instead of app-store apps
2026-10-31 · Accepted · Planning · Technical

## Context
Hard constraint: $0 to build, host and share. Both users want it on their phones, usable offline, and opening like an app.

## Options
- **Native iOS and Android apps:** best install experience, but $99/year for Apple, $25 for Google, review delays and two builds.
- **Installable PWA on GitHub Pages:** one codebase, free hosting for a public repo, offline through a service worker, installs from the browser.
- **Plain website:** simplest, but no offline use and no home-screen icon.

## Decision
A PWA served from the public repo `ashwynkmr/graphite` at `ashwynkmr.github.io/graphite`, auto-deployed by GitHub Actions. It installs via "Add to Home Screen" on iPhone and "Install app" on Android and desktop Chrome/Edge, opens full-screen, and works offline after the first visit. An Android APK stays a Phase 3 option; the iOS App Store isn't planned.

## Trade-offs
iOS install is less discoverable: there's no install prompt, so the app shows a one-time "Share → Add to Home Screen" hint. No App Store presence. iOS Safari can clear site storage after long inactivity (see [0008](0008-no-login-local-progress.md)). The repo must be public, so all content is visible, which is fine because it's original.

## Signals to revisit
- Install or offline behaviour fails on either user's phone.
- iOS storage eviction actually happens during the study period.
