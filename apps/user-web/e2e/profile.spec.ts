import { expect, test } from '@playwright/test';

test.describe('User Web - Profile Page', () => {
  test('should render profile form and allow updating information', async ({ page }) => {
    await page.goto('/profile');

    // Check page title
    await expect(page.locator('h1.page-title')).toHaveText(/Hồ Sơ Cá Nhân/);

    // Check form inputs
    const fullNameInput = page.getByPlaceholder('Nhập họ và tên');
    await expect(fullNameInput).toBeVisible();

    // Fill form
    await fullNameInput.fill('Nguyễn Văn E2E Tester');
    await page.getByPlaceholder('+84988888888').fill('+84912345678');
    await page.getByPlaceholder('Ví dụ: Công nghệ thông tin').fill('Quality Assurance');

    // Submit form
    await page.getByRole('button', { name: 'Lưu Thay Đổi' }).click();

    // Verify success message
    await expect(
      page.getByText('Hồ sơ đã được cập nhật thành công (đồng bộ validation Zod)!')
    ).toBeVisible();
  });

  test('should navigate back to home page from profile', async ({ page }) => {
    await page.goto('/profile');

    // Click back button
    await page.getByRole('button', { name: 'Quay lại' }).click();

    // Verify redirected back to home
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h1.page-title')).toHaveText(/Cổng Thông Tin Người Dùng/);
  });
});
