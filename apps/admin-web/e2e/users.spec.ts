import { expect, test } from '@playwright/test';

test.describe('Admin Web - Users Page', () => {
  test('should render users table and allow searching', async ({ page }) => {
    await page.goto('/users');

    // Check page title
    await expect(page.locator('h1.page-title')).toHaveText(/Quản Lý Người Dùng/);

    // Check table headers
    await expect(page.getByRole('columnheader', { name: 'ID' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Họ và Tên' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Phòng Ban' })).toBeVisible();

    // Check search input
    const searchInput = page.getByPlaceholder('Tìm kiếm theo tên, email, phòng ban...');
    await expect(searchInput).toBeVisible();

    // Filter by name
    await searchInput.fill('Quản Trị Viên');
    await expect(page.getByText('admin@enterprise.internal')).toBeVisible();

    // Clear search
    await searchInput.clear();
    await expect(page.getByText('user@enterprise.internal')).toBeVisible();
  });
});
