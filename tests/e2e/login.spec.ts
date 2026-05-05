import { expect, test } from '@playwright/test';
import { mockOtpLoginApi } from './fixtures';

test('completes the OTP login flow and redirects to the dashboard', async ({ page }) => {
  await mockOtpLoginApi(page);

  await page.goto('/auth/login');
  await page.getByLabel('Email').fill('priya@example.com');
  await page.getByRole('button', { name: /send sign-in code/i }).click();

  await expect(page.getByText(/your sign-in code is on its way/i)).toBeVisible();
  await expect(page.getByText(/verification code sent to priya@example.com/i)).toBeVisible();

  await page.getByLabel('Verification Code').fill('123456');
  await page.getByRole('button', { name: /verify and sign in/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: /welcome back, priya/i })).toBeVisible();
  await expect(page.getByText('Q2 Roadmap')).toBeVisible();
});
