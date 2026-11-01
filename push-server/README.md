# Graphite reminder service

Sends Graphite's optional reminders. It runs on Cloudflare Workers and stores a phone's push address and the times that phone asked to be woken, and nothing else. At each time it sends an empty wake-up. The phone decides the times from how the user is studying, and writes the message from its own data. See decisions [0037](../docs/decisions/0037-push-reminders-with-on-device-text.md) and [0038](../docs/decisions/0038-reminder-service-on-cloudflare.md).

The app works fully without this service. If it stops, reminders stop and nothing else changes.

## Set up

Needs a free Cloudflare account. From this folder:

```bash
npm ci
npx wrangler login
npm run setup
```

`npm run setup` creates the database, makes the secret key and stores it directly in Cloudflare without showing it, publishes the service, and writes the app's public settings to `../.env.production`. It's safe to run again; it keeps what already exists. Commit `wrangler.toml` and `.env.production` afterwards: neither holds a secret.

## Run locally

Put test values in a git-ignored `.dev.vars` (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `ALLOWED_ORIGINS`), then run `npm run dev`. The schedule doesn't fire by itself locally; request `/__scheduled?cron=*+*+*+*+*` to run it.
