import { expect, test } from '@playwright/test';
import { answerQuant, signIn, table, waitForServiceWorker } from './helpers';

test('after the first visit, drills and vocab work with no network', async ({ page, context }) => {
  await signIn(page);
  await waitForServiceWorker(page);
  await context.setOffline(true);

  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Test');

  await page.getByRole('button', { name: 'Quick drill' }).click();
  await expect(page).toHaveURL(/quant\/session/);
  await answerQuant(page, true);
  await expect(page.locator('body')).toContainText('2 / 20');
  await page.getByRole('button', { name: /End drill/ }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: /End/ }).click();
  await expect(page).toHaveURL(/results/);

  await page.goto('./#/vocab');
  await page.getByRole('button', { name: /^Start \d+/ }).click();
  await expect(page).toHaveURL(/vocab\/session/);

  for (const path of ['mistakes', 'progress', 'settings']) {
    await page.goto(`./#/${path}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
});

test('with reminders off, the app talks to nothing but itself', async ({ page }) => {
  const outside: string[] = [];
  page.on('request', (r) => {
    const { hostname, protocol } = new URL(r.url());
    if (hostname !== 'localhost' && protocol !== 'blob:' && protocol !== 'data:') outside.push(r.url());
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Quick drill' }).click();
  await expect(page).toHaveURL(/quant\/session/);
  for (let i = 0; i < 20; i++) await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page).toHaveURL(/results/);
  for (const path of ['', 'vocab', 'quant', 'mistakes', 'progress', 'settings']) {
    await page.goto(`./#/${path}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
  expect(outside).toEqual([]);
});

test('every main screen fits a 375 px phone with no sideways scroll', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: 'Quick drill' }).click();
  await expect(page).toHaveURL(/quant\/session/);
  for (let i = 0; i < 20; i++) await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page).toHaveURL(/results/);
  const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(await fits()).toBe(true);
  for (const path of ['', 'quant', 'vocab', 'mistakes', 'progress', 'settings']) {
    await page.goto(`./#/${path}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await fits(), path).toBe(true);
  }
});

test('a backup restores progress after a reset, and Reset everything starts over', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: 'Quick drill' }).click();
  await expect(page).toHaveURL(/quant\/session/);
  for (let i = 0; i < 20; i++) await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page).toHaveURL(/results/);
  const attempts = (await table(page, 'quantAttempts')).length;
  expect(attempts).toBe(20);

  await page.goto('./#/settings');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const backup = await downloading;
  expect(backup.suggestedFilename()).toMatch(/^graphite-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const path = await backup.path();

  // Reset progress keeps the name.
  await page.getByRole('button', { name: 'Reset progress' }).click();
  const dialog = page.getByRole('alertdialog');
  const confirm = dialog.getByRole('button', { name: 'Reset', exact: true });
  await expect(confirm).toBeDisabled();
  await dialog.getByRole('textbox').fill('reset');
  await confirm.click();
  await expect(page.locator('body')).toContainText('Progress cleared.');
  expect((await table(page, 'quantAttempts')).length).toBe(0);

  // A file that isn't a backup changes nothing, and says so with the wordmark.
  await page.locator('input[type=file]').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"a":1}') });
  await expect(page.getByRole('alert')).toContainText('not a');
  await expect(page.getByRole('alert').getByRole('img', { name: 'Graphite' })).toBeVisible();

  await page.locator('input[type=file]').setInputFiles(path);
  await page.getByRole('button', { name: 'Replace' }).click();
  await expect(page.locator('body')).toContainText('Progress restored.');
  expect((await table(page, 'quantAttempts')).length).toBe(attempts);

  await page.getByRole('button', { name: 'Reset everything' }).click();
  await page.getByRole('alertdialog').getByRole('textbox').fill('reset');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByPlaceholder('Your name')).toBeVisible();
});

test('Share saves the image and copies the text where there is no share sheet', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: undefined });
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Quick drill' }).click();
  await expect(page).toHaveURL(/quant\/session/);
  for (let i = 0; i < 20; i++) await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page).toHaveURL(/results/);

  const share = page.getByRole('button', { name: 'Share' });
  await expect(share).toBeEnabled();
  const downloading = page.waitForEvent('download');
  await share.click();
  const image = await downloading;
  expect(image.suggestedFilename()).toMatch(/^graphite-result-.*\.png$/);
  await expect(page.getByRole('status')).toContainText('Copied the text and saved the image.');
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toMatch(/^Graphite · Quant drill · 0\/20 \(0%\)/);
  expect(text).not.toContain('Test');
});
