import { expect, test } from '@playwright/test';
import { answerQuant, currentSession, expectNoVerdict, signIn, table, type SessionRow } from './helpers';

test('a Quick drill scores exactly what was answered, then retries only the misses', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: 'Quick drill' }).click();
  await expect(page).toHaveURL(/quant\/session/);
  const session = await currentSession(page);
  expect(session.items).toHaveLength(20);

  for (let i = 0; i < 20; i++) {
    await answerQuant(page, i < 12);
    if (i < 19) await expectNoVerdict(page);
  }

  await expect(page).toHaveURL(/results/);
  await expect(page.locator('body')).toContainText('of 20');
  const done = (await table<SessionRow>(page, 'sessions')).find((s) => s.id === session.id)!;
  expect(done.score).toEqual({ correct: 12, total: 20 });

  await page.getByRole('button', { name: 'Retry 8 wrong' }).click();
  await expect(page).toHaveURL(/quant\/session/);
  const retry = await currentSession(page);
  expect(retry.items.map((i) => JSON.stringify(i.ref)).sort()).toEqual(session.items.slice(12).map((i) => JSON.stringify(i.ref)).sort());
});

test('a mistake leaves the log after two correct answers in a row, and a miss resets it', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: 'Quick drill' }).click();
  await expect(page).toHaveURL(/quant\/session/);
  for (let i = 0; i < 20; i++) await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page).toHaveURL(/results/);

  const drillLog = async (right: boolean) => {
    await page.goto('./#/mistakes');
    await page.getByRole('button', { name: /Drill my mistakes/ }).click();
    await expect(page).toHaveURL(/quant\/session/);
    for (let i = 0; i < 20; i++) await answerQuant(page, right);
    await expect(page).toHaveURL(/results/);
  };

  await drillLog(true);
  await page.goto('./#/mistakes');
  await expect(page.locator('body')).toContainText('Quant (20)');
  await expect(page.locator('body')).toContainText('1 of 2 correct');

  await drillLog(false);
  await page.goto('./#/mistakes');
  await expect(page.locator('body')).toContainText('Quant (20)');
  await expect(page.locator('body')).not.toContainText('1 of 2 correct');

  await drillLog(true);
  await drillLog(true);
  await page.goto('./#/mistakes');
  await expect(page.locator('body')).toContainText('Nothing here yet');
});

test('a reload mid-drill keeps every answer and offers to resume', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: 'Quick drill' }).click();
  await expect(page).toHaveURL(/quant\/session/);
  for (let i = 0; i < 3; i++) await answerQuant(page, true);

  await page.reload();
  await page.goto('./#/');
  await expect(page.locator('body')).toContainText('Drill in progress');
  await expect(page.locator('body')).toContainText('3 of 20');
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.locator('body')).toContainText('4 / 20');
});

test('results offer a report link for that exact question', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: 'Quick drill' }).click();
  await expect(page).toHaveURL(/quant\/session/);
  const session = await currentSession(page);
  for (let i = 0; i < 20; i++) await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page).toHaveURL(/results/);
  const first = session.items[0]!.ref as { id: string };
  const href = await page.getByRole('link', { name: 'Report a problem' }).first().getAttribute('href');
  expect(href).toContain('github.com/ashwynkmr/graphite/issues/new');
  expect(href).toContain(`id=${first.id}`);
});

test('fractions are stacked, and their lines stay on the card’s ruled spacing', async ({ page }) => {
  await signIn(page);
  await page.goto('./#/quant');
  await page.getByRole('button', { name: 'Fractions', exact: true }).click();
  await page.getByRole('button', { name: /^Start \d+/ }).click();
  await expect(page).toHaveURL(/quant\/session/);

  let seen = 0;
  for (let i = 0; i < 20 && seen === 0; i++) {
    seen = await page.locator('p [role=img]').count();
    if (!seen) await page.getByRole('button', { name: 'Skip' }).click();
  }
  expect(seen).toBeGreaterThan(0);
  await expect(page.locator('p [role=img]').first()).toHaveAttribute('aria-label', /\d+ (and \d+ )?over|\d+ over \d+/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  // Taller than plain text would push a two-line prompt off the 38 px lines.
  const lineHeight = await page.locator('p:has([role=img])').first().evaluate((p) => {
    const lines = p.getBoundingClientRect().height / parseFloat(getComputedStyle(p).lineHeight);
    return Math.abs(lines - Math.round(lines));
  });
  expect(lineHeight).toBeLessThan(0.05);
});
