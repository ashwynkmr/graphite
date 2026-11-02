import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { answerQuant, signIn } from './helpers';

// README screenshots, taken from the real app. Only runs when asked: SCREENSHOTS=1 npx playwright test screenshots
const OUT = resolve(import.meta.dirname, '../../docs/assets/screens');

test.use({ deviceScaleFactor: 2, colorScheme: 'light', viewport: { width: 375, height: 750 } });
test.skip(!process.env.SCREENSHOTS, 'Only for updating the README');

/** Made-up study for the screenshot only: accuracy climbing and times falling over two weeks. */
async function seedTwoWeeks(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((done, fail) => {
        const open = indexedDB.open('graphite');
        open.onerror = () => fail(open.error);
        open.onsuccess = () => {
          const tx = open.result.transaction(['quantAttempts', 'sessions'], 'readwrite');
          const topics = ['percents', 'fractions', 'ratios', 'rates', 'money'];
          // The robot's instant answers from earlier in this run would read as 0 seconds.
          tx.objectStore('quantAttempts').clear();
          [13, 12, 11, 9, 8, 7, 6, 4, 3, 2, 1, 0].forEach((ago, n) => {
            const date = new Date();
            date.setDate(date.getDate() - ago);
            const day = date.toLocaleDateString('en-CA');
            tx.objectStore('sessions').put({ id: `seed-${n}`, type: 'quant', status: 'finished', day, startedAt: 1, finishedAt: 2 + n, seed: 1, settings: {}, origin: { kind: 'drill' }, items: [], answers: [{ value: '1', ms: 1 }], cursor: 1, timer: {}, limitMs: null });
            for (let i = 0; i < 30; i++) {
              const wrongEvery = 3 + Math.floor(n / 2);
              tx.objectStore('quantAttempts').add({ sessionId: `seed-${n}`, questionId: `seed-${n}-${i}`, topic: topics[i % 5], difficulty: 2, day, mode: 'typed', answer: '1', correct: (i + n) % (i % 5 === 1 ? 2 : wrongEvery) !== 0, ms: 38_000 - n * 2200 + (i % 3) * 800, flags: [] });
            }
          });
          tx.oncomplete = () => {
            open.result.close();
            done();
          };
        };
      }),
  );
}

test('capture the main screens', async ({ page }) => {
  mkdirSync(OUT, { recursive: true });
  const shot = (name: string) => page.screenshot({ path: `${OUT}/${name}.png` });

  await signIn(page, 'Ashwyn');
  await page.getByRole('button', { name: 'Quick drill' }).click();
  await expect(page).toHaveURL(/quant\/session/);
  for (let i = 0; i < 20; i++) {
    await answerQuant(page, i % 5 !== 0);
    if (i === 3) await shot('drill');
  }
  await expect(page).toHaveURL(/results/);
  await expect(page.getByRole('button', { name: 'Share' })).toBeEnabled();
  await shot('results');

  await page.goto('./#/vocab');
  await page.getByRole('button', { name: /^Start \d+/ }).click();
  await expect(page).toHaveURL(/vocab\/session/);
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);
  await shot('flashcard');
  await page.keyboard.press('ArrowRight');
  await page.goto('./#/');
  await page.getByRole('button', { name: 'Discard' }).click();

  await page.goto('./#/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.waitForTimeout(400);
  await shot('home');
  await page.goto('./#/mistakes');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.waitForTimeout(400);
  await shot('mistakes');
  await seedTwoWeeks(page);
  await page.goto('./#/progress');
  await page.reload();
  await expect(page.locator('figure').first()).toContainText('%');
  await page.waitForTimeout(400);
  await shot('progress');
  await page.goto('./#/vocab/browse');
  await page.getByRole('searchbox').fill('enervate');
  await expect(page.getByRole('button', { name: /^enervate/ })).toHaveAttribute('aria-expanded', 'true');
  await page.evaluate(() => (document.activeElement as HTMLElement).blur());
  await page.waitForTimeout(400);
  await shot('browse');
  await page.goto('./#/quant');
  await page.getByRole('radio', { name: 'Sprint' }).click();
  await page.getByRole('button', { name: 'Adaptive', exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(600);
  await shot('sprint');
});
