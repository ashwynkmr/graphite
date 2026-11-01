# Graphite push server

Sends Graphite's optional reminders. It stores a phone's push address and the times that phone asked to be woken, and nothing else. At each time it sends an empty wake-up. The phone decides the times from how the user is studying, and writes the message from its own data. See [decision 0037](../docs/decisions/0037-push-reminders-with-on-device-text.md).

The app works fully without this server. If it's down, reminders stop and nothing else changes.

## Run locally

```bash
npm ci
cp .env.example .env
npm run keys        # paste the pair into .env
npm run dev
```

With no `DATABASE_URL`, subscriptions stay in memory and a restart loses them.

## Deploy on Northflank

1. Generate a key pair with `npm run keys`. Keep the private key out of the repo and out of chat.
2. Add a combined service from `ashwynkmr/graphite`, with build context `/push-server` and the Dockerfile at `/push-server/Dockerfile`.
3. Expose port `3001` publicly over HTTP.
4. Set these as secrets on the service: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `ALLOWED_ORIGINS=https://ashwynkmr.github.io`, `DATABASE_URL`, `PORT=3001`.
5. `DATABASE_URL` can point at an existing Postgres addon. The server only touches its own table, `graphite_push_subscriptions`, which it creates on start.
6. Check `https://<service-domain>/health` returns `{"ok":true}`.
7. In the app repo, add a committed `.env.production` with two public values, then push:

```
VITE_PUSH_SERVER_URL=https://<service-domain>
VITE_PUSH_PUBLIC_KEY=<the public key>
```

The Reminders section stays hidden in Settings until those two values exist.
