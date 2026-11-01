// Everything a phone may send. This server stores a push address and the times to wake it: no study data.

export interface SubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
  /** When to wake this phone, epoch ms. The phone works these out from its own data. */
  wakeTimes: number[];
}

/**
 * The browsers' push services. The server POSTs to whatever endpoint it stores, so an unchecked
 * endpoint would let anyone aim it at any address.
 */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /^web\.push\.apple\.com$/, /(^|\.)push\.apple\.com$/, /^updates\.push\.services\.mozilla\.com$/, /(^|\.)notify\.windows\.com$/];

const MAX_LENGTH = 1024;
const MAX_WAKE_TIMES = 32;
const MAX_AHEAD_MS = 40 * 24 * 60 * 60 * 1000;

const isShortString = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= MAX_LENGTH;

export function isPushEndpoint(value: unknown): value is string {
  if (!isShortString(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.port === '' && PUSH_HOSTS.some((h) => h.test(url.hostname));
  } catch {
    return false;
  }
}

function isWakeTimes(value: unknown, now: number): value is number[] {
  return Array.isArray(value) && value.length <= MAX_WAKE_TIMES && value.every((t) => Number.isSafeInteger(t) && t > 0 && t < now + MAX_AHEAD_MS);
}

export function parseSubscription(body: unknown, now: number): SubscriptionInput | null {
  const b = body as { subscription?: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }; wakeTimes?: unknown } | null;
  const endpoint = b?.subscription?.endpoint;
  const p256dh = b?.subscription?.keys?.p256dh;
  const auth = b?.subscription?.keys?.auth;
  const wakeTimes = b?.wakeTimes;
  if (!isPushEndpoint(endpoint) || !isShortString(p256dh) || !isShortString(auth) || !isWakeTimes(wakeTimes, now)) return null;
  return { endpoint, p256dh, auth, wakeTimes };
}

/** Exact origins, or `*.example.com` for any subdomain over https (staging tunnels change name each run). */
export function originAllowed(origin: string, allowed: readonly string[]): boolean {
  return allowed.some((a) => {
    if (!a.startsWith('*.')) return a === origin;
    try {
      const url = new URL(origin);
      return url.protocol === 'https:' && url.hostname.endsWith(a.slice(1));
    } catch {
      return false;
    }
  });
}
