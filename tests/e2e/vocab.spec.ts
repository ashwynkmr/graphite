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

test('an exam-style sentence fits a short phone, keeps its verdict for results and shows there', async ({ page }) => {
  const bank = JSON.parse(readFileSync(resolve(import.meta.dirname, '../../content/equiv-sentences.json'), 'utf8')) as { id: string; sentence: string; answer: [string, string]; decoy: [string, string]; others: [string, string] }[];
  const longest = bank.reduce((a, b) => (b.sentence.length > a.sentence.length ? b : a));
  const [wordId, partner] = longest.answer;
  await page.setViewportSize({ width: 375, height: 664 });
  await signIn(page);
  await startWith(page, 'Sentence equivalence');
  const session = await currentSession(page);
  expect(session.items.some((i) => (i as { sentenceId?: string }).sentenceId)).toBe(true);

  // Put the longest sentence first, as if the session had dealt it.
  const widest = bank.flatMap((s) => [...s.answer, ...s.decoy, ...s.others]).reduce((a, b) => (b.length > a.length ? b : a));
  const choices = [...longest.answer, ...longest.decoy, longest.others[0], widest];
  await page.evaluate(
    ({ id, item }) =>
      new Promise<void>((done) => {
        const open = indexedDB.open('graphite');
        open.onsuccess = () => {
          const store = open.result.transaction('sessions', 'readwrite').objectStore('sessions');
          const get = store.get(id);
          get.onsuccess = () => {
            const row = get.result;
            row.items[row.cursor] = item;
            store.put(row).onsuccess = () => {
              open.result.close();
              done();
            };
          };
        };
      }),
    { id: session.id, item: { wordId, kind: 'equiv', partner, sentenceId: longest.id, sentence: longest.sentence, choices } },
  );
  await page.reload();
  await expect(page.locator('body')).toContainText(longest.sentence);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  const cut = await page.getByRole('list', { name: 'Choose two words' }).locator('button').evaluateAll((all) => all.filter((b) => b.scrollWidth > b.clientWidth).map((b) => b.textContent));
  expect(cut).toEqual([]);
  await page.getByRole('button', { name: new RegExp(`^[A-F] ${wordId}$`) }).click();
  await page.getByRole('button', { name: new RegExp(`^[A-F] ${partner}$`) }).click();
  const submit = (await page.getByRole('button', { name: 'Submit' }).boundingBox())!;
  expect(submit.y + submit.height).toBeLessThanOrEqual(664);
  // The first height with one column has the least room.
  await page.setViewportSize({ width: 375, height: 761 });
  const tall = (await page.getByRole('button', { name: 'Submit' }).boundingBox())!;
  expect(tall.y + tall.height).toBeLessThanOrEqual(761);
  await page.getByRole('button', { name: 'Submit' }).click();
  await expectNoVerdict(page);

  await page.getByRole('button', { name: 'End session' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: /End/ }).click();
  await expect(page).toHaveURL(/vocab\/results/);
  await expect(page.locator('body')).toContainText(longest.sentence);
  await expect(page.locator('body')).toContainText(`Pairs with ${partner} in that sentence.`);
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
  // The best match opens by itself, straight under the bar: a phone's keyboard covers the lower half.
  const found = page.getByRole('button', { name: /^laconic/ });
  await expect(found).toHaveAttribute('aria-expanded', 'true');
  expect((await found.boundingBox())!.y).toBeLessThan(260);
  await expect(page.getByRole('radio', { name: 'Top 500' })).toBeHidden();
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
  // The word is bold in its sentence.
  await expect(page.locator('strong').first()).toBeVisible();
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

