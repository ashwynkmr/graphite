import { expect, test } from '@playwright/test';
import { answerQuant, answerSprint, currentSession, expectNoVerdict, signIn, table, type SessionRow } from './helpers';

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
  // The next question appears only once the answer is saved.
  await expect(page.locator('body')).toContainText('4 / 20');

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

test('a sprint stops at time-up and counts only what was answered', async ({ page }) => {
  await page.clock.install();
  await signIn(page);
  await page.getByRole('link', { name: 'Quant' }).click();
  await page.getByRole('radio', { name: 'Sprint' }).click();
  await page.getByRole('radio', { name: '2 min' }).click();
  await page.getByRole('button', { name: 'Start 2-minute sprint' }).click();
  await expect(page).toHaveURL(/quant\/session/);
  await expect(page.locator('body')).toContainText('0 answered');
  const session = await currentSession(page);
  expect(session.limitMs).toBe(120_000);
  const lined = session.items.length;
  expect(lined).toBe(50);

  for (let i = 0; i < 3; i++) {
    await answerSprint(page, i, i < 2);
    await expect(page.locator('body')).toContainText(`${i + 1} answered`);
    await expectNoVerdict(page);
  }

  await page.clock.runFor(121_000);
  await expect(page).toHaveURL(/results/);
  await expect(page.locator('body')).toContainText('of 3');
  await expect(page.locator('body')).toContainText('2-minute sprint');
  const done = (await table<SessionRow>(page, 'sessions')).find((s) => s.id === session.id)!;
  expect(done.score).toEqual({ correct: 2, total: 3 });
  expect(done.items).toHaveLength(3);
  expect(await table(page, 'mistakes')).toHaveLength(1);
});

test('a remembered sprint never turns a Quick drill into one', async ({ page }) => {
  await signIn(page);
  await page.getByRole('link', { name: 'Quant' }).click();
  await page.getByRole('radio', { name: 'Sprint' }).click();
  await page.getByRole('button', { name: /Start .*sprint/ }).click();
  await expect(page).toHaveURL(/quant\/session/);
  await page.getByRole('button', { name: 'End sprint' }).click();
  await page.getByRole('button', { name: 'End sprint' }).click();
  await expect(page).toHaveURL(/results/);
  await expect(page.locator('body')).toContainText('Nothing answered');
  await page.getByRole('link', { name: 'Done' }).click();
  await page.getByRole('button', { name: 'Quick drill' }).click();
  await expect(page.locator('body')).toContainText('1 / 20');
});

test('Adaptive is chosen in place of levels, and each topic remembers its own setup', async ({ page }) => {
  await signIn(page);
  await page.getByRole('link', { name: 'Quant' }).click();
  const adaptive = page.getByRole('button', { name: 'Adaptive', exact: true });
  const hard = page.getByRole('button', { name: 'Hard', exact: true });

  // Fractions alone, on Adaptive: a drill served at Medium, where every new topic starts.
  await page.getByRole('button', { name: 'Fractions', exact: true }).click();
  await adaptive.click();
  await expect(adaptive).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Medium', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: /Start 20 questions/ }).click();
  await expect(page).toHaveURL(/quant\/session/);
  const session = await currentSession(page);
  expect(session.settings?.adaptive).toBe(true);
  expect(session.items.every((i) => (i.ref as { id: string }).id.includes('-m-'))).toBe(true);
  await page.getByRole('button', { name: 'Pause and go home' }).click();
  await page.getByRole('button', { name: 'Discard' }).click();

  // Another topic gets a different setup; Fractions comes back as it was.
  await page.getByRole('link', { name: 'Quant' }).click();
  await page.getByRole('button', { name: 'Fractions', exact: true }).click();
  await page.getByRole('button', { name: 'Mixed: give me anything' }).click();
  await page.getByRole('button', { name: 'Percents', exact: true }).click();
  await hard.click();
  await expect(adaptive).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('radio', { name: 'Choices' }).click();
  await page.getByRole('button', { name: /Start 20 questions/ }).click();
  await expect(page).toHaveURL(/quant\/session/);
  await page.getByRole('button', { name: 'Pause and go home' }).click();
  await page.getByRole('button', { name: 'Discard' }).click();

  await page.getByRole('link', { name: 'Quant' }).click();
  await page.getByRole('button', { name: 'Percents', exact: true }).click();
  await page.getByRole('button', { name: 'Fractions', exact: true }).click();
  await expect(adaptive).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('radio', { name: 'Mix' })).toHaveAttribute('aria-checked', 'true');
});
