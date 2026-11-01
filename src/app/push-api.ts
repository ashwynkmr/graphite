// Talking to the reminder server, from the app and from the service worker. Sends a push address
// and wake-up times, nothing else (0037).
const SERVER = import.meta.env.VITE_PUSH_SERVER_URL as string | undefined;
const TIMEOUT_MS = 10_000;

export const pushServerConfigured = Boolean(SERVER);

export async function sendPlan(subscription: PushSubscription, wakeTimes: readonly number[], keepalive = false): Promise<boolean> {
  const response = await fetch(`${SERVER}/subscription`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: subscription.toJSON(), wakeTimes }),
    keepalive,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return response.ok;
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  await fetch(`${SERVER}/subscription`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}
