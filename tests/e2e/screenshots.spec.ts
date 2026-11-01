import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { answerQuant, signIn } from './helpers';

// README screenshots, taken from the real app. Only runs when asked: SCREENSHOTS=1 npx playwright test screenshots
const OUT = resolve(import.meta.dirname, '../../docs/assets/screens');

test.use({ deviceScaleFactor: 2, colorScheme: 'light', viewport: { width: 375, height: 750 } });
test.skip(!process.env.SCREENSHOTS, 'Only for updating the README');

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
});
