# 0008. No login; progress stays on each device, with Share and Export
2026-10-31 · Accepted · Planning · Product

## Context
Two people will use Graphite, each on a phone and a laptop. Syncing progress across devices and comparing scores would need accounts and a backend. Ashwyn explicitly rejected multi-device login: it adds build time, a running service and personal data to protect, all for a three-week tool.

## Options
- **Accounts with cloud sync:** progress everywhere, but needs auth, a database and privacy handling; not $0 to run safely.
- **No accounts; local IndexedDB per device; Share and Export:** zero setup for the second user, nothing to host.
- **Sync via a third-party free tier:** cheaper than a custom backend, still accounts, and a dependency that can change terms.

## Decision
No login. Each browser keeps its own progress in IndexedDB. A Share button sends a session's stats (image card + text) through the phone's share sheet. Export and import move or back up progress as one JSON file; import replaces local data after a confirmation.

## Trade-offs
No sync: phone and laptop keep separate stats, and merging two devices is out of scope. There's a small risk of losing data if browser storage is cleared, mostly on iOS Safari after weeks without opening the app. Mitigations: install to the home screen, request persistent storage, and show an export reminder every 3 days.

## Signals to revisit
- Either user loses progress to cleared storage.
- Users regularly study on two devices and find split stats confusing.
- A real need to compare scores live (parked as a Phase 3 option that would need a free backend).
