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
