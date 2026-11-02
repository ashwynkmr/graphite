# 0016. Review every checkpoint on staging before anything is committed
2026-10-31 · Superseded by [0042](0042-phase-2-on-a-branch-commit-as-we-go.md) for Phase 2 · Phase 1 · Scope

## Context
Until Checkpoint A2, each step was committed, pushed and deployed straight to the live site, and Ashwyn reviewed afterwards. After A2, Ashwyn asked to approve each checkpoint on a staging site first: nothing is committed or pushed until it looks right there (FB-12). GitHub Pages serves one site per repo, a staging branch would itself need a push, and other repos are off limits.

## Options
- **Keep shipping straight to live:** fastest, but feedback only arrives after changes are public.
- **Local network preview:** no new tools, but the phone must be on the same Wi-Fi, and install and offline can't be tested without HTTPS.
- **HTTPS quick tunnel from Ashwyn's Mac** (Cloudflare `cloudflared`, no account): a temporary https URL that works on any network and supports install and offline testing.

## Decision
HTTPS quick tunnel. At each checkpoint (A3, B1, B2, C) the production build runs locally behind a temporary tunnel URL. Work stays uncommitted until Ashwyn approves; then it's committed, pushed and deployed, and the feedback round is recorded with links to the commits.

## Trade-offs
- Staging works only while the Mac is awake and the tunnel is running, and the URL changes each time.
- Larger uncommitted batches between checkpoints, so less granular history (mitigated by splitting the approved work into several focused commits).
- Content passes through Cloudflare's relay while staging. It's the same public app content that ships to GitHub Pages, and no user data leaves the phone.
- A slower path to live than before, which is the point.

## Signals to revisit
- Staging review becomes the bottleneck for daily study.
- The tunnel is unreliable on Ashwyn's phone.
