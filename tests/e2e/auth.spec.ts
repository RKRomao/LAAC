import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');
  });

  test('should display login page correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Login.*LAAC/);
    
    // Check main elements
    await expect(page.locator('h3')).toContainText('Bem-vindo de Volta');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Entrar');
    
    // Check register link
    await expect(page.locator('a[href="/register"]')).toContainText('Registar-se');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('.alert-danger')).toBeVisible();
    await expect(page.locator('.alert-danger')).toContainText('Credenciais inválidas');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill in valid credentials
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to home page
    await expect(page).toHaveURL('/');
    
    // Should show user menu
    await expect(page.locator('.navbar-nav .dropdown-toggle')).toContainText('Test User');
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]');
    const toggleButton = page.locator('button[onclick="togglePassword()"]');
    
    // Password should be hidden by default
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle button
    await toggleButton.click();
    
    // Password should be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click toggle button again
    await toggleButton.click();
    
    // Password should be hidden again
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration page correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Registar.*LAAC/);
    
    // Check main elements
    await expect(page.locator('h3')).toContainText('Criar Conta');
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('select[name="role"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Criar Conta');
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('input[name="name"]:invalid')).toBeVisible();
    await expect(page.locator('input[name="email"]:invalid')).toBeVisible();
    await expect(page.locator('input[name="password"]:invalid')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]:invalid')).toBeVisible();
  });

  test('should show error when passwords do not match', async ({ page }) => {
    // Fill form with mismatched passwords
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'differentpassword');
    await page.selectOption('select[name="role"]', 'student');
    
    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('.alert-danger')).toBeVisible();
    await expect(page.locator('.alert-danger')).toContainText('As passwords não coincidem');
  });

  test('should register successfully with valid data', async ({ page }) => {
    // Fill form with valid data
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.selectOption('select[name="role"]', 'student');
    
    // Accept terms
    await page.check('input[name="terms"]');
    
    // Submit form
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('.alert-success')).toBeVisible();
    await expect(page.locator('.alert-success')).toContainText('Registo realizado com sucesso');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });

  test('should show password strength indicator', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]');
    
    // Type weak password
    await passwordInput.fill('123');
    
    // Should show weak password indicator
    const strengthBar = page.locator('#passwordStrength .progress-bar');
    await expect(strengthBar).toHaveClass(/bg-danger/);
    
    // Type strong password
    await passwordInput.fill('StrongPassword123!');
    
    // Should show strong password indicator
    await expect(strengthBar).toHaveClass(/bg-success/);
  });
});

test.describe('Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should display user profile', async ({ page }) => {
    // Navigate to profile
    await page.click('.navbar-nav .dropdown-toggle');
    await page.click('a[href="/profile"]');
    
    // Should show profile page
    await expect(page.locator('h1, h2')).toContainText('Perfil');
    await expect(page.locator('text=test@example.com')).toBeVisible();
  });

  test('should update profile successfully', async ({ page }) => {
    // Navigate to profile
    await page.click('.navbar-nav .dropdown-toggle');
    await page.click('a[href="/profile"]');
    
    // Update profile
    await page.fill('input[name="name"]', 'Updated Name');
    await page.fill('input[name="avatar"]', 'https://example.com/avatar.jpg');
    await page.click('button[type="submit"]');
    
    // Should show success message
    await expect(page.locator('.alert-success')).toBeVisible();
    await expect(page.locator('.alert-success')).toContainText('Perfil atualizado com sucesso');
    
    // Should show updated name in navbar
    await expect(page.locator('.navbar-nav .dropdown-toggle')).toContainText('Updated Name');
  });

  test('should logout successfully', async ({ page }) => {
    // Logout
    await page.click('.navbar-nav .dropdown-toggle');
    await page.click('a[onclick="logout()"]');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
    
    // Should not show user menu
    await expect(page.locator('.navbar-nav .dropdown-toggle')).not.toBeVisible();
    
    // Should show login/register buttons
    await expect(page.locator('a[href="/login"]')).toBeVisible();
    await expect(page.locator('a[href="/register"]')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  ['Desktop Chrome', 'Mobile Chrome'].forEach(deviceName => {
    test(`should work correctly on ${deviceName}`, async ({ page }) => {
      // Set viewport based on device
      if (deviceName === 'Mobile Chrome') {
        await page.setViewportSize({ width: 375, height: 667 });
      } else {
        await page.setViewportSize({ width: 1280, height: 720 });
      }

      // Navigate to login page
      await page.goto('/login');

      // Check elements are visible and properly sized
      await expect(page.locator('h3')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // Test form submission
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Should work regardless of viewport size
      await expect(page).toHaveURL('/', { timeout: 10000 });
    });
  });
});
