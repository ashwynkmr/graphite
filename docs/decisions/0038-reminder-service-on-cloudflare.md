# 0038. The reminder service runs on Cloudflare Workers
2026-11-01 · Accepted · Phase 1 · Technical

Replaces the hosting plan in [0037](0037-push-reminders-with-on-device-text.md); the rest of 0037 stands.

## Context
The service was built for Northflank. When Ashwyn opened the dashboard to deploy it, a banner reported a security incident. Northflank's status page said to treat all environment variables as compromised, and listed builds and services in a major outage. It was still open on Nov 1, with the cause undisclosed. The exam is 23 days away.

## Options
- Wait for Northflank: no rewrite, but no end date.
- Stay in-app only: nothing more to build, but no notifications.
- Cloudflare Workers with its D1 database: free plan, scheduled jobs, no always-on server to run.

## Decision
Cloudflare Workers, Ashwyn's choice after hearing the options. An empty push needs no message encryption, so the service signs its own requests with no push library. `npm run setup` makes the private key and stores it directly in Cloudflare, so nobody sees it. The app's address and public key are committed, since neither is secret. The allowed sites include staging tunnels, so checkpoints can be tried on a phone first.

## Trade-offs
- The free plan allows 10 ms of processing per run. Measured use was 2 to 6 ms with one due wake-up. A run that goes over should retry the next minute, which is untested.
- Subscriptions are capped at 20, and a stranger could fill them, which would block new sign-ups.

## Signals to revisit
- Runs fail on the limit, or reminders go missing.
- The subscription cap fills up.
