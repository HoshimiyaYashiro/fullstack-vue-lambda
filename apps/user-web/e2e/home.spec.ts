import { expect, test } from '@playwright/test';

test.describe('User Web - Home Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user profile API response for deterministic E2E test
    await page.route('**/users/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'usr_user_1',
          email: 'user@enterprise.internal',
          fullName: 'Nguyễn Văn Người Dùng',
          department: 'Kinh Doanh & Phát Triển',
          status: 'active',
        }),
      });
    });
  });

  test('should render portal title and account overview', async ({ page }) => {
    await page.goto('/');

    // Verify header title
    await expect(page.locator('h1.page-title')).toHaveText(/Cổng Thông Tin Người Dùng/);

    // Verify account overview card is visible
    await expect(page.getByText('Tổng Quan Tài Khoản')).toBeVisible();

    // Verify architecture card is visible
    await expect(page.getByText('Kiến Trúc File-based Routing Chuẩn Doanh Nghiệp')).toBeVisible();
  });

  test('should navigate to profile page via CTA button', async ({ page }) => {
    await page.goto('/');

    // Click on profile link button
    await page.getByRole('button', { name: 'Xem Chi Tiết Hồ Sơ' }).click();

    // Verify URL changed to /profile
    await expect(page).toHaveURL(/\/profile$/);

    // Verify profile page loaded
    await expect(page.locator('h1.page-title')).toHaveText(/Hồ Sơ Cá Nhân/);
  });
});
