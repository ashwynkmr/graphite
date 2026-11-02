import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { answerQuant, answerSprint, currentSession, pickSprint, expectNoVerdict, signIn, table, type SessionRow } from './helpers';

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

/** Turns the sprint dial from its low end, one 30-second step per key press, to the given minutes. */
async function chooseSprintTime(page: Page, minutes: number): Promise<void> {
  const dial = page.getByRole('slider', { name: 'Time' });
  await dial.focus();
  await page.keyboard.press('Home');
  await expect(dial).toHaveAttribute('aria-valuetext', '0:30');
  for (let i = 1; i < minutes * 2; i++) await page.keyboard.press('ArrowRight');
  await expect(dial).toHaveAttribute('aria-valuenow', String(minutes * 60));
}

test('the sprint dial runs from 30 seconds to 15 minutes', async ({ page }) => {
  await signIn(page);
  await page.getByRole('link', { name: 'Quant' }).click();
  await page.getByRole('radio', { name: 'Sprint' }).click();
  const dial = page.getByRole('slider', { name: 'Time' });
  await expect(dial).toHaveAttribute('aria-valuetext', '5:00');
  await dial.focus();
  await page.keyboard.press('Home');
  await expect(dial).toHaveAttribute('aria-valuetext', '0:30');
  await expect(page.getByRole('button', { name: 'Start 30-second sprint' })).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: 'Start 1:30 sprint' })).toBeVisible();
  await page.keyboard.press('End');
  await expect(dial).toHaveAttribute('aria-valuetext', '15:00');
  await expect(page.getByRole('button', { name: 'Start 15-minute sprint' })).toBeVisible();
});

test('a sprint stops at time-up and counts only what was answered', async ({ page }) => {
  await page.clock.install();
  await signIn(page);
  await page.getByRole('link', { name: 'Quant' }).click();
  await page.getByRole('radio', { name: 'Sprint' }).click();
  await chooseSprintTime(page, 2);
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

test('at time-up a picked option counts as answered, and an unpicked question does not', async ({ page }) => {
  await page.clock.install();
  await signIn(page);
  await page.getByRole('link', { name: 'Quant' }).click();
  await page.getByRole('radio', { name: 'Sprint' }).click();
  await chooseSprintTime(page, 2);
  await page.getByRole('radio', { name: 'Choices' }).click();
  await page.getByRole('button', { name: 'Start 2-minute sprint' }).click();
  await expect(page).toHaveURL(/quant\/session/);
  const session = await currentSession(page);

  await answerSprint(page, 0, true);
  await expect(page.locator('body')).toContainText('1 answered');
  // Picked, never submitted.
  await pickSprint(page, 1, true);
  await page.clock.runFor(121_000);
  await expect(page).toHaveURL(/results/);
  let done = (await table<SessionRow>(page, 'sessions')).find((s) => s.id === session.id)!;
  expect(done.score).toEqual({ correct: 2, total: 2 });

  // Nothing picked: the question on screen doesn't count.
  await page.getByRole('button', { name: 'New sprint' }).click();
  await expect(page).toHaveURL(/quant\/session/);
  const next = await currentSession(page);
  await answerSprint(page, 0, true);
  await expect(page.locator('body')).toContainText('1 answered');
  await page.clock.runFor(121_000);
  await expect(page).toHaveURL(/results/);
  done = (await table<SessionRow>(page, 'sessions')).find((s) => s.id === next.id)!;
  expect(done.score).toEqual({ correct: 1, total: 1 });
});

test('at phone size, the longest question and Submit are both in view, typed or multiple choice', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 664 });
  const bank = JSON.parse(readFileSync(resolve(import.meta.dirname, '../../content/questions.json'), 'utf8')) as { id: string; prompt: string; format: string; choices?: string[]; rounding?: string }[];
  const longest = (list: typeof bank) => [...list].sort((a, b) => b.prompt.length - a.prompt.length)[0]!;
  await signIn(page);
  await page.getByRole('button', { name: 'Quick drill' }).click();
  await expect(page).toHaveURL(/quant\/session/);
  const id = new URL(page.url()).hash.split('/').pop()!;
  const plain = bank.filter((q) => q.format !== 'compare');
  for (const [mode, question] of [['typed', longest(plain.filter((q) => !q.rounding))], ['mcq', longest(plain.filter((q) => q.choices))], ['mcq', longest(bank.filter((q) => q.format === 'compare'))]] as const) {
    await page.evaluate(
      ({ sessionId, questionId, mode, choices }) =>
        new Promise<void>((done) => {
          const open = indexedDB.open('graphite');
          open.onsuccess = () => {
            const store = open.result.transaction('sessions', 'readwrite').objectStore('sessions');
            const get = store.get(sessionId);
            get.onsuccess = () => {
              const row = get.result;
              row.items[row.cursor] = { ref: { kind: 'bank', id: questionId }, mode, ...(mode === 'mcq' ? { choices } : {}) };
              store.put(row).onsuccess = () => {
                open.result.close();
                done();
              };
            };
          };
        }),
      { sessionId: id, questionId: question.id, mode, choices: question.choices },
    );
    await page.reload();
    await expect(page.locator('body')).toContainText(question.prompt.slice(0, 20));
    const fits = await page.evaluate(() => {
      const main = document.querySelector('main')!;
      return { scrollsInside: main.scrollHeight > main.clientHeight + 1, pageScrolls: document.documentElement.scrollHeight > window.innerHeight + 1 };
    });
    expect(fits.pageScrolls).toBe(false);
    expect(fits.scrollsInside).toBe(false);
    const submit = (await page.getByRole('button', { name: 'Submit' }).boundingBox())!;
    expect(submit.y + submit.height).toBeLessThanOrEqual(664);
    expect(submit.height).toBeGreaterThanOrEqual(48);
  }
});

test('a comparison drill shows both quantities and four answers in exam order, with no verdict, then labels them on Results', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 664 });
  await signIn(page);
  await page.goto('./#/quant');
  await page.getByRole('button', { name: 'Comparison', exact: true }).click();
  await page.getByRole('radio', { name: 'Typed' }).click();
  await page.getByRole('button', { name: /^Start 20 questions/ }).click();
  await expect(page).toHaveURL(/quant\/session/);
  for (let i = 0; i < 20; i++) {
    await expect(page.getByRole('term').first()).toHaveText('Quantity A');
    await expect(page.getByRole('radio')).toHaveText(['AQuantity A is greater', 'BQuantity B is greater', 'CThe two quantities are equal', 'DIt cannot be determined']);
    await expectNoVerdict(page);
    const submit = (await page.getByRole('button', { name: 'Submit' }).boundingBox())!;
    expect(submit.y + submit.height).toBeLessThanOrEqual(664);
    await answerQuant(page, i % 2 === 0);
  }
  await expect(page).toHaveURL(/results/);
  await expect(page.locator('body')).toContainText(/10\s*of 20/);
  await expect(page.locator('body')).toContainText(/Quantity [AB] is greater|equal|cannot be determined/);
});
