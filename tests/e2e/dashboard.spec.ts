import { expect, test } from '@playwright/test';
import { mockAuthenticatedApi, seedAuthenticatedSession } from './fixtures';

test('renders dashboard metrics, workspace content, and shared boards for a signed-in user', async ({ page }) => {
  await seedAuthenticatedSession(page);
  await mockAuthenticatedApi(page);

  await page.goto('/dashboard');

  await expect(page.getByRole('heading', { name: /welcome back, priya/i })).toBeVisible();
  await expect(page.getByText('Workspaces')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Product Studio' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Q2 Roadmap' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /boards you can access through collaboration/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Client Shared Board' })).toBeVisible();
});
