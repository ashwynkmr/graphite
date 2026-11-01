// Private notes in a public repo. The text and the names that unlock it never appear here: the notes
// are encrypted, and only typing one of the right names opens them. Works in the app, the service
// worker and the content tools (0041).
const ITERATIONS = 150_000;

interface Sealed {
  iv: string;
  data: string;
}

export interface SealedNotes {
  notes: Sealed;
  /** The notes' key, wrapped once per name. */
  keys: (Sealed & { salt: string })[];
}

const encoder = new TextEncoder();
const toText = (bytes: ArrayBuffer) => new TextDecoder().decode(bytes);
const toBase64 = (bytes: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(bytes as ArrayBuffer)));
const fromBase64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

/** So "Name", " name " and "NAME" all count as the same person. */
export function normalizeName(name: string): string {
  return name.normalize('NFKC').trim().toLocaleLowerCase('en');
}

async function nameKey(name: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', encoder.encode(normalizeName(name)), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function seal(key: CryptoKey, plain: Uint8Array<ArrayBuffer>): Promise<Sealed> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return { iv: toBase64(iv), data: toBase64(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain)) };
}

function unseal(key: CryptoKey, sealed: Sealed): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(sealed.iv) }, key, fromBase64(sealed.data));
}

export async function sealNotes(notes: readonly string[], names: readonly string[]): Promise<SealedNotes> {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const notesKey = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt']);
  const keys = [];
  for (const name of names) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    keys.push({ salt: toBase64(salt), ...(await seal(await nameKey(name, salt), raw)) });
  }
  return { notes: await seal(notesKey, encoder.encode(JSON.stringify(notes))), keys };
}

/** The notes, or null if this name doesn't open them. */
export async function openNotes(sealed: SealedNotes, name: string): Promise<string[] | null> {
  for (const entry of sealed.keys) {
    try {
      const raw = await unseal(await nameKey(name, fromBase64(entry.salt)), entry);
      const notesKey = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
      return JSON.parse(toText(await unseal(notesKey, sealed.notes))) as string[];
    } catch {
      // Not this name's key; try the next.
    }
  }
  return null;
}
