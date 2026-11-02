import { expect, test, type Page } from '@playwright/test';
import { answerQuant, currentSession, signIn, table, waitForServiceWorker } from './helpers';

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

test('Progress shows trends, weakest topics, stages and levels from real answers, and shares a history', async ({ page }) => {
  await signIn(page);
  await page.getByRole('link', { name: 'Progress' }).click();
  await expect(page.locator('body')).toContainText('Last 14 days');
  await expect(page.locator('body')).toContainText('Nothing yet');
  await expect(page.locator('body')).not.toContainText('Share your history');

  await page.goto('./#/');
  await page.getByRole('link', { name: 'Quant' }).click();
  await page.getByRole('button', { name: 'Percents', exact: true }).click();
  await page.getByRole('button', { name: 'Adaptive', exact: true }).click();
  await page.getByRole('button', { name: /Start 20 questions/ }).click();
  await expect(page).toHaveURL(/quant\/session/);
  for (let i = 0; i < 20; i++) await answerQuant(page, i < 5);
  await expect(page).toHaveURL(/results/);
  // 15 of the last 20 wrong: Percents moves down.
  await expect(page.locator('body')).toContainText('Percents moves down to Easy next time.');

  await page.goto('./#/progress');
  await expect(page.locator('figure').first()).toContainText('25% of 20');
  const row = page.getByRole('row', { name: /Percents/ });
  await expect(row).toContainText('Weakest');
  await expect(row).toContainText('25%');
  await expect(row).toContainText('Easy');

  // Another topic has no answers, and says so.
  await page.getByRole('combobox').selectOption('ratios');
  await expect(page.locator('figure').first()).toContainText('Nothing yet');
  await page.getByRole('combobox').selectOption('all');

  await expect(page.getByRole('button', { name: 'Share' })).toBeEnabled({ timeout: 10_000 });
  await page.getByRole('radio', { name: '14 days' }).click();
  await expect(page.getByRole('button', { name: 'Share' })).toBeEnabled({ timeout: 10_000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('the mistake log filters by topic, and Drill my mistakes follows the filter', async ({ page }) => {
  await signIn(page);
  for (const name of ['Percents', 'Ratios']) {
    await page.goto('./#/quant');
    const chip = page.getByRole('button', { name, exact: true });
    await chip.click();
    await page.getByRole('slider', { name: 'Questions' }).focus();
    await page.keyboard.press('Home');
    await page.getByRole('button', { name: 'Start 5 questions' }).click();
    await expect(page).toHaveURL(/quant\/session/);
    for (let i = 0; i < 5; i++) await answerQuant(page, false);
    await expect(page).toHaveURL(/results/);
    await page.goto('./#/quant');
    await chip.click();
  }
  await page.goto('./#/mistakes');
  await expect(page.getByRole('radio', { name: 'Quant (10)' })).toBeVisible();
  await page.getByRole('button', { name: 'Percents', exact: true }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'Ratios' })).toHaveCount(0);
  await expect(page.getByRole('listitem').filter({ hasText: 'Percents' })).toHaveCount(5);
  await page.getByRole('button', { name: 'Drill my mistakes (5)' }).click();
  await expect(page).toHaveURL(/quant\/session/);
  const { items } = await currentSession(page);
  expect(items).toHaveLength(5);
  // Ratios questions have their own ids; none came through the filter.
  expect(items.every((i) => !(i.ref as { id: string }).id.startsWith('ra-'))).toBe(true);
});

test('dragging across a chart moves its line from day to day', async ({ page }) => {
  await signIn(page);
  await page.goto('./#/progress');
  const chart = page.locator('figure').first();
  const box = (await chart.locator('button').first().locator('..').boundingBox())!;
  const column = box.width / 14;
  const reading = chart.locator('figcaption span').last();
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + column * 2.5, y);
  await page.mouse.down();
  await expect(reading).toContainText('no answers');
  const first = await reading.innerText();
  const cross = chart.locator('svg line').last();
  const startX = Number(await cross.getAttribute('x1'));
  // Most of a column isn't enough; the line waits for the next day.
  await page.mouse.move(box.x + column * 2.9, y);
  await expect(reading).toHaveText(first);
  expect(Number(await cross.getAttribute('x1'))).toBe(startX);
  await page.mouse.move(box.x + column * 3.1, y);
  await expect(reading).not.toHaveText(first);
  const moved = Number(await cross.getAttribute('x1')) - startX;
  expect(moved).toBeCloseTo((343 - 34) / 14, 3);
  await page.mouse.up();
});

test('after a drill, Results suggests the weak topic, and a paused session comes first', async ({ page }) => {
  await signIn(page);
  await page.goto('./#/quant');
  await page.getByRole('button', { name: 'Percents', exact: true }).click();
  await page.getByRole('button', { name: /Start 20 questions/ }).click();
  await expect(page).toHaveURL(/quant\/session/);
  for (let i = 0; i < 20; i++) {
    await answerQuant(page, i < 5);
    if (i < 19) await expect(page.locator('body')).not.toContainText('weakest');
  }
  await expect(page).toHaveURL(/results/);
  await expect(page.locator('body')).toContainText('Percents was your weakest last time (25%). Do 20 more?');

  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page).toHaveURL(/quant\/session/);
  await answerQuant(page, true);
  await expect(page.locator('body')).toContainText('2 / 20');
  await page.getByRole('button', { name: 'Pause and go home' }).click();

  // A second session finishes while that one waits.
  await page.goto('./#/quant');
  await page.getByRole('button', { name: /Start \d+ questions/ }).click();
  await expect(page).toHaveURL(/quant\/session/);
  await page.getByRole('button', { name: 'End drill' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: /End/ }).click();
  await expect(page).toHaveURL(/results/);
  await expect(page.locator('body')).toContainText('You left a drill at 1 of 20. Pick it up?');
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.locator('body')).toContainText('2 / 20');
});

/** Puts this device back to before the What's New screen existed, as on an updated install. */
async function forgetWhatsNew(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((done, fail) => {
        const open = indexedDB.open('graphite');
        open.onerror = () => fail(open.error);
        open.onsuccess = () => {
          const tx = open.result.transaction('meta', 'readwrite');
          tx.objectStore('meta').delete('whatsNewSeen');
          tx.oncomplete = () => {
            open.result.close();
            done();
          };
        };
      }),
  );
}

test('What’s New shows once after an update, never to a new user, and stays in Settings', async ({ page }) => {
  await signIn(page);
  await expect(page.locator('body')).not.toContainText('What’s new');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Test');
  await expect(page.locator('body')).not.toContainText('What’s new');

  await forgetWhatsNew(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'What’s new' })).toBeVisible();
  await expect(page.locator('body')).toContainText('Harder Sentence Equivalence');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Back to studying' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Test');

  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Test');
  await expect(page.getByRole('heading', { name: 'What’s new' })).toBeHidden();

  await page.goto('./#/settings');
  await page.getByRole('link', { name: 'What’s new' }).click();
  await expect(page.getByRole('heading', { name: 'What’s new' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to Settings' }).click();
  await expect(page).toHaveURL(/settings/);
});

test('What’s New waits while a session is open', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: 'Quick drill' }).click();
  await expect(page).toHaveURL(/quant\/session/);
  await forgetWhatsNew(page);
  await page.reload();
  await expect(page.locator('body')).toContainText('1 / 20');
  await expect(page.getByRole('heading', { name: 'What’s new' })).toBeHidden();
  await page.getByRole('button', { name: 'Pause and go home' }).click();
  await expect(page.getByRole('heading', { name: 'What’s new' })).toBeVisible();
});


test('A new user gets the quick tour once, it writes no study data, and it replays from Settings', async ({ page }) => {
  await page.goto('./');
  await page.getByPlaceholder('Your name').fill('Test');
  await page.getByRole('button', { name: /start studying/i }).click();
  const tour = page.getByRole('dialog', { name: 'Quick tour' });
  await expect(tour).toContainText('1 of 5');
  // Everything underneath waits while the tour is open.
  await expect(page.getByRole('link', { name: 'Quant' }).click({ timeout: 500 })).rejects.toThrow();
  for (const [step, path] of [['Quant', /quant/], ['Vocab', /vocab/], ['Mistakes', /mistakes/], ['Progress', /progress/]] as const) {
    await tour.getByRole('button', { name: 'Next' }).click();
    await expect(tour.getByRole('heading', { name: step })).toBeVisible();
    await expect(page).toHaveURL(path);
    const box = (await tour.locator('div').last().boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await tour.getByRole('button', { name: 'Start studying' }).click();
  await expect(tour).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Test');
  expect(await table(page, 'sessions')).toHaveLength(0);

  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Test');
  await expect(tour).toBeHidden();

  await page.goto('./#/settings');
  await page.getByRole('button', { name: 'Take the quick tour' }).click();
  await expect(tour).toContainText('1 of 5');
  await page.keyboard.press('Escape');
  await expect(tour).toBeHidden();
});

test('Someone who had the app before the tour never gets it on their own', async ({ page }) => {
  await signIn(page);
  await page.evaluate(
    () =>
      new Promise<void>((done) => {
        const open = indexedDB.open('graphite');
        open.onsuccess = () => {
          const tx = open.result.transaction('meta', 'readwrite');
          tx.objectStore('meta').delete('tutorialOwed');
          tx.oncomplete = () => {
            open.result.close();
            done();
          };
        };
      }),
  );
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Test');
  await expect(page.getByRole('dialog', { name: 'Quick tour' })).toBeHidden();
});
