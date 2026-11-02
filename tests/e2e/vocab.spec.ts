import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { currentSession, expectNoVerdict, signIn, table } from './helpers';

async function startWith(page: Page, mode: string): Promise<void> {
  await page.goto('./#/vocab');
  await page.getByRole('button', { name: mode, exact: true }).click();
  if (mode !== 'Flashcards') await page.getByRole('button', { name: 'Flashcards', exact: true }).click();
  await page.getByRole('button', { name: /^Start \d+/ }).click();
  await expect(page).toHaveURL(/vocab\/session/);
}

test('missed quiz words stay hidden until results, then reach the mistake log', async ({ page }) => {
  await signIn(page);
  await startWith(page, 'Choices');
  for (let i = 0; i < 3; i++) {
    const session = await currentSession(page);
    const item = session.items[session.cursor]!;
    const wrong = item.choices!.findIndex((c) => c !== item.wordId);
    await page.getByRole('radio').nth(wrong).click();
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.locator('body')).toContainText(`${i + 2} / `);
    await expectNoVerdict(page);
  }
  await page.getByRole('button', { name: 'End session' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: /End/ }).click();
  await expect(page).toHaveURL(/vocab\/results/);
  await expect(page.locator('body')).toContainText('Missed · 3');

  await page.goto('./#/mistakes');
  await expect(page.locator('body')).toContainText('Words (3)');
});

test('flashcard marks move words into the right boxes', async ({ page }) => {
  await signIn(page);
  await startWith(page, 'Flashcards');
  const marks = ['ArrowRight', 'ArrowRight', 'ArrowUp', 'ArrowLeft'];
  for (const [i, key] of marks.entries()) {
    await page.keyboard.press(key);
    await expect(page.locator('body')).toContainText(`${i + 2} / `);
  }
  await page.getByRole('button', { name: 'End session' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: /End/ }).click();
  await expect(page).toHaveURL(/vocab\/results/);
  const states = await table<{ box: number; lastResult: string }>(page, 'wordStates');
  expect(states.map((s) => s.lastResult).sort()).toEqual(['know', 'know', 'review', 'unsure']);
  expect(states.every((s) => s.box === 1)).toBe(true);
  const known = await table<{ refId: string }>(page, 'mistakes');
  expect(known).toHaveLength(1);
});

const WORDS = JSON.parse(readFileSync(resolve(import.meta.dirname, '../../content/words.json'), 'utf8')) as { id: string; word: string; mnemonic?: string }[];

/** Marks every word as seen, as after the first pass through the deck. */
async function seeAllWords(page: Page): Promise<void> {
  await page.evaluate(
    (ids) =>
      new Promise<void>((done, fail) => {
        const open = indexedDB.open('graphite');
        open.onerror = () => fail(open.error);
        open.onsuccess = () => {
          const tx = open.result.transaction('wordStates', 'readwrite');
          ids.forEach((wordId, i) =>
            tx.objectStore('wordStates').put({ wordId, box: i === 0 ? 5 : i === 1 ? 1 : 3, dueDay: '2099-01-01', seen: 1, correct: 1, lastResult: 'know', starred: i === 2 ? 1 : 0, round: 1, firstSeenDay: '2026-11-01' }),
          );
          tx.oncomplete = () => {
            open.result.close();
            done();
          };
        };
      }),
    WORDS.map((w) => w.id),
  );
}

test('Browse finds a word by name or meaning, and starring it reaches the Starred deck', async ({ page }) => {
  await signIn(page);
  await page.getByRole('link', { name: 'Vocab' }).click();
  await page.getByRole('link', { name: 'Browse and search all words' }).click();
  await expect(page.locator('body')).toContainText('1,500 words');
  const search = page.getByRole('searchbox');
  await search.fill('laconic');
  await page.getByRole('button', { name: /^laconic/ }).click();
  await expect(page.locator('body')).toContainText('New');
  await page.getByRole('button', { name: 'Star', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Unstar' })).toBeVisible();

  await search.fill('');
  await page.getByRole('button', { name: 'Starred', exact: true }).click();
  await expect(page.locator('body')).toContainText('1 word');
  await page.getByRole('button', { name: 'Starred', exact: true }).click();
  await page.getByRole('radio', { name: 'Last 500' }).click();
  await expect(page.locator('body')).toContainText('500 words');
  await page.getByRole('button', { name: 'Show more' }).click();

  // Looking a word up isn't studying: its box stays new.
  expect(((await table<{ wordId: string; box: number; seen: number }>(page, 'wordStates')).find((r) => r.wordId === 'laconic'))?.seen).toBe(0);
});

test('a memory aid shows on the back of its flashcard, and the card still fits the screen', async ({ page }) => {
  await signIn(page);
  await startWith(page, 'Flashcards');
  const session = await currentSession(page);
  const withAid = session.items.findIndex((i) => WORDS.find((w) => w.id === i.wordId)?.mnemonic);
  for (let i = 0; i < withAid; i++) {
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('body')).toContainText(`${i + 2} / `);
  }
  await page.getByText('Tap to flip').first().click();
  const aid = WORDS.find((w) => w.id === session.items[withAid]!.wordId)!.mnemonic!;
  await expect(page.locator('body')).toContainText(aid);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('after the first pass, Home offers Round 2, weakest first, and Not now stops asking', async ({ page }) => {
  await signIn(page);
  await seeAllWords(page);
  await page.reload();
  await expect(page.locator('body')).toContainText('Start Round 2?');

  await page.getByRole('button', { name: 'Not now' }).click();
  await expect(page.locator('body')).not.toContainText('Start Round 2?');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Start Round 2?');

  // Still there for the taking in the Vocab tab.
  await page.getByRole('link', { name: 'Vocab' }).click();
  await page.getByRole('radio', { name: 'Round 2' }).click();
  await expect(page.locator('body')).toContainText('Weakest first · 1500 to go');
  await page.getByRole('button', { name: /^Start \d+/ }).click();
  await expect(page).toHaveURL(/vocab\/session/);
  const session = await currentSession(page);
  // Starred first, then the box 1 word; the retired word isn't near the front.
  expect(session.items[0]!.wordId).toBe(WORDS[2]!.id);
  expect(session.items[1]!.wordId).toBe(WORDS[1]!.id);
  expect(session.items.map((i) => i.wordId)).not.toContain(WORDS[0]!.id);
});

