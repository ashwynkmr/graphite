import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, type Page } from '@playwright/test';

interface Question {
  id: string;
  answer: string;
}

const bank = new Map((JSON.parse(readFileSync(resolve(import.meta.dirname, '../../content/questions.json'), 'utf8')) as Question[]).map((q) => [q.id, q]));

export interface SessionItem {
  ref?: { kind: 'bank'; id: string } | { kind: 'gen' };
  mode?: 'typed' | 'mcq';
  choices?: string[];
  kind?: string;
  wordId?: string;
}

export interface SessionRow {
  id: string;
  status: string;
  cursor: number;
  items: SessionItem[];
  score?: { correct: number; total: number };
}

/** Reads a whole table straight from the app's database. */
export function table<T>(page: Page, name: string): Promise<T[]> {
  return page.evaluate(
    (store) =>
      new Promise<T[]>((resolvePromise, reject) => {
        const open = indexedDB.open('graphite');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const get = db.transaction(store).objectStore(store).getAll();
          get.onsuccess = () => {
            db.close();
            resolvePromise(get.result as T[]);
          };
        };
      }),
    name,
  );
}

export async function currentSession(page: Page): Promise<SessionRow> {
  const id = new URL(page.url()).hash.split('/').pop();
  const rows = await table<SessionRow>(page, 'sessions');
  const row = rows.find((r) => r.id === id);
  if (!row) throw new Error(`No session ${id}`);
  return row;
}

/** Fails if a stranger could see a verdict during a session (results only at the end, 0007). */
export async function expectNoVerdict(page: Page): Promise<void> {
  await expect(page.locator('body')).not.toContainText(/\b(correct|incorrect|right!|wrong!|well done|try again)\b/i);
}

/** The first run: name prompt, then Home. */
export async function signIn(page: Page, name = 'Test'): Promise<void> {
  await page.goto('./');
  await page.getByPlaceholder('Your name').fill(name);
  await page.getByRole('button', { name: /start studying/i }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(name);
}

const KEY: Record<string, string> = { '-': 'minus', '/': 'fraction slash', '.': 'decimal point' };

/** Answers the current quant question the way a person would. */
export async function answerQuant(page: Page, right: boolean): Promise<void> {
  const session = await currentSession(page);
  const position = `${session.cursor + 1} / ${session.items.length}`;
  await expect(page.locator('body')).toContainText(position);
  const item = session.items[session.cursor]!;
  const ref = item.ref as { kind: string; id?: string };
  const answer = ref.kind === 'bank' ? bank.get(ref.id!)?.answer : undefined;
  if (!answer) throw new Error('Test drills should only use bank questions');
  if (item.mode === 'mcq') {
    const wanted = item.choices!.indexOf(answer);
    const pick = right ? wanted : (wanted + 1) % item.choices!.length;
    await page.getByRole('radio').nth(pick).click();
  } else {
    // A valid wrong answer; no question in the bank has this as its answer.
    for (const ch of right ? answer : '9999') {
      await page.getByRole('button', { name: KEY[ch] ?? ch, exact: true }).click();
    }
  }
  await page.getByRole('button', { name: 'Submit' }).click();
}

export async function waitForServiceWorker(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // A page opened before the worker took over isn't served by it until it reloads.
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
}
