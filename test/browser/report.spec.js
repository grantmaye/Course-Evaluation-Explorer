import { test, expect } from '@playwright/test';
test('filter, compare query results, and handle empty reports', async ({ page }, info) => {
  const errors = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Feedback by course' })).toBeVisible();
  await expect(page.getByText('SQLite preview', { exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: /Database Systems/ })).toBeVisible();
  if (info.project.name === 'desktop') await page.screenshot({ path: 'test-results/dashboard.png', fullPage: true });
  await page.getByLabel('Institution', { exact: true }).selectOption('2');
  await page.getByRole('button', { name: /Run report/ }).click();
  await expect(page.getByRole('status')).toContainText('Summit University');
  await page.getByRole('button', { name: /Query lab/ }).click();
  await page.getByRole('button', { name: 'Compare queries' }).click();
  await expect(page.getByText('✓ Results match', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Evaluation report/ }).click();
  await page.getByLabel('Submission year').selectOption('2027');
  await page.getByRole('button', { name: /Run report/ }).click();
  await expect(page.getByRole('heading', { name: 'No evaluations in this period' })).toBeVisible();
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('a failed request gives a retry path', async ({ page }) => {
  await page.route('**/api/report*', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Temporary report failure.' }) }));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Temporary report failure.');
  await page.unroute('**/api/report*');
  await page.getByRole('button', { name: /Run report/ }).click();
  await expect(page.getByRole('heading', { name: 'Feedback by course' })).toBeVisible();
});
