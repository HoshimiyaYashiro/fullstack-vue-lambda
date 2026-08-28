import { expect, test } from '@playwright/test';

test.describe('Admin Web - Home Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock backend metrics endpoint for deterministic E2E test
    await page.route('**/admin/metrics', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalUsers: 15,
          activeUsers: 12,
          lambdaInvocations: 45200,
          systemHealth: 'healthy',
        }),
      });
    });
  });

  test('should render admin dashboard title and metrics overview', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page.locator('h1.page-title')).toHaveText(/Bảng Điều Khiển Quản Trị/);

    // Check admin portal tag within page header
    await expect(page.locator('.page-header').getByText('Admin Portal')).toBeVisible();

    // Check metric labels
    await expect(page.getByText('Tổng Thành Viên')).toBeVisible();
    await expect(page.getByText('Thành Viên Hoạt Động')).toBeVisible();
    await expect(page.getByText('Lambda Invocations')).toBeVisible();
    await expect(page.getByText('Trạng Thái Hệ Thống')).toBeVisible();
  });

  test('should display enterprise architecture information cards', async ({ page }) => {
    await page.goto('/');

    // Check enterprise decoupling section
    await expect(
      page.getByText('Cấu Trúc Tách Biệt Doanh Nghiệp (Enterprise Decoupling)')
    ).toBeVisible();
  });
});
