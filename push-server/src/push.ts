// Sends one empty push, the "wake up" signal. An empty push needs no message encryption, only a
// signed note proving it came from this service (VAPID), so no library is needed.
const TOKEN_LIFETIME_S = 12 * 60 * 60;
/** A reminder that can't arrive within an hour isn't worth delivering. */
const TTL_SECONDS = 60 * 60;

export interface Vapid {
  publicKey: string;
  privateKey: string;
  subject: string;
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  return Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(text.length / 4) * 4, '=')), (c) => c.charCodeAt(0));
}

export async function signVapid(audience: string, vapid: Vapid, now: number): Promise<string> {
  const header = toBase64Url(encoder.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = toBase64Url(encoder.encode(JSON.stringify({ aud: audience, exp: Math.floor(now / 1000) + TOKEN_LIFETIME_S, sub: vapid.subject })));
  // The public key is 0x04, then x and y, 32 bytes each.
  const point = fromBase64Url(vapid.publicKey);
  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', d: vapid.privateKey, x: toBase64Url(point.slice(1, 33)), y: toBase64Url(point.slice(33, 65)), ext: true },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, encoder.encode(`${header}.${claims}`));
  return `${header}.${claims}.${toBase64Url(new Uint8Array(signature))}`;
}

/** Throws with `statusCode` when the phone's push service refuses, so the caller can tell gone from busy. */
export async function sendEmptyPush(endpoint: string, vapid: Vapid, now: number, send: typeof fetch = fetch): Promise<void> {
  const token = await signVapid(new URL(endpoint).origin, vapid, now);
  const response = await send(endpoint, {
    method: 'POST',
    headers: { Authorization: `vapid t=${token}, k=${vapid.publicKey}`, TTL: String(TTL_SECONDS), 'Content-Length': '0' },
  });
  if (!response.ok) throw Object.assign(new Error(`Push refused: ${response.status}`), { statusCode: response.status });
}
