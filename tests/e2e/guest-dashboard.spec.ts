import { expect, test } from '@playwright/test';
import { mockGuestApi } from './fixtures';

test('shows the landing page and public workspace cards', async ({ page }) => {
  await mockGuestApi(page);

  await page.goto('/');

  await expect(page.getByRole('heading', { name: /organize anything/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /start for free/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /see how teams organize work in the open/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Product Studio' })).toBeVisible();
  await expect(page.getByRole('link', { name: /explore workspace/i }).first()).toBeVisible();
});
