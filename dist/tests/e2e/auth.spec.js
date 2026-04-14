"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
test_1.test.describe('Authentication Flow', () => {
    test_1.test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });
    (0, test_1.test)('should display login page correctly', async ({ page }) => {
        await (0, test_1.expect)(page).toHaveTitle(/Login.*LAAC/);
        await (0, test_1.expect)(page.locator('h3')).toContainText('Bem-vindo de Volta');
        await (0, test_1.expect)(page.locator('input[name="email"]')).toBeVisible();
        await (0, test_1.expect)(page.locator('input[name="password"]')).toBeVisible();
        await (0, test_1.expect)(page.locator('button[type="submit"]')).toContainText('Entrar');
        await (0, test_1.expect)(page.locator('a[href="/register"]')).toContainText('Registar-se');
    });
    (0, test_1.test)('should show error with invalid credentials', async ({ page }) => {
        await page.fill('input[name="email"]', 'invalid@example.com');
        await page.fill('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');
        await (0, test_1.expect)(page.locator('.alert-danger')).toBeVisible();
        await (0, test_1.expect)(page.locator('.alert-danger')).toContainText('Credenciais inválidas');
    });
    (0, test_1.test)('should login successfully with valid credentials', async ({ page }) => {
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await (0, test_1.expect)(page).toHaveURL('/');
        await (0, test_1.expect)(page.locator('.navbar-nav .dropdown-toggle')).toContainText('Test User');
    });
    (0, test_1.test)('should toggle password visibility', async ({ page }) => {
        const passwordInput = page.locator('input[name="password"]');
        const toggleButton = page.locator('button[onclick="togglePassword()"]');
        await (0, test_1.expect)(passwordInput).toHaveAttribute('type', 'password');
        await toggleButton.click();
        await (0, test_1.expect)(passwordInput).toHaveAttribute('type', 'text');
        await toggleButton.click();
        await (0, test_1.expect)(passwordInput).toHaveAttribute('type', 'password');
    });
});
test_1.test.describe('Registration Flow', () => {
    test_1.test.beforeEach(async ({ page }) => {
        await page.goto('/register');
    });
    (0, test_1.test)('should display registration page correctly', async ({ page }) => {
        await (0, test_1.expect)(page).toHaveTitle(/Registar.*LAAC/);
        await (0, test_1.expect)(page.locator('h3')).toContainText('Criar Conta');
        await (0, test_1.expect)(page.locator('input[name="name"]')).toBeVisible();
        await (0, test_1.expect)(page.locator('input[name="email"]')).toBeVisible();
        await (0, test_1.expect)(page.locator('input[name="password"]')).toBeVisible();
        await (0, test_1.expect)(page.locator('input[name="confirmPassword"]')).toBeVisible();
        await (0, test_1.expect)(page.locator('select[name="role"]')).toBeVisible();
        await (0, test_1.expect)(page.locator('button[type="submit"]')).toContainText('Criar Conta');
    });
    (0, test_1.test)('should show validation errors for empty fields', async ({ page }) => {
        await page.click('button[type="submit"]');
        await (0, test_1.expect)(page.locator('input[name="name"]:invalid')).toBeVisible();
        await (0, test_1.expect)(page.locator('input[name="email"]:invalid')).toBeVisible();
        await (0, test_1.expect)(page.locator('input[name="password"]:invalid')).toBeVisible();
        await (0, test_1.expect)(page.locator('input[name="confirmPassword"]:invalid')).toBeVisible();
    });
    (0, test_1.test)('should show error when passwords do not match', async ({ page }) => {
        await page.fill('input[name="name"]', 'John Doe');
        await page.fill('input[name="email"]', 'john@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.fill('input[name="confirmPassword"]', 'differentpassword');
        await page.selectOption('select[name="role"]', 'student');
        await page.click('button[type="submit"]');
        await (0, test_1.expect)(page.locator('.alert-danger')).toBeVisible();
        await (0, test_1.expect)(page.locator('.alert-danger')).toContainText('As passwords não coincidem');
    });
    (0, test_1.test)('should register successfully with valid data', async ({ page }) => {
        await page.fill('input[name="name"]', 'John Doe');
        await page.fill('input[name="email"]', 'john.doe@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.fill('input[name="confirmPassword"]', 'password123');
        await page.selectOption('select[name="role"]', 'student');
        await page.check('input[name="terms"]');
        await page.click('button[type="submit"]');
        await (0, test_1.expect)(page.locator('.alert-success')).toBeVisible();
        await (0, test_1.expect)(page.locator('.alert-success')).toContainText('Registo realizado com sucesso');
        await (0, test_1.expect)(page).toHaveURL('/login');
    });
    (0, test_1.test)('should show password strength indicator', async ({ page }) => {
        const passwordInput = page.locator('input[name="password"]');
        await passwordInput.fill('123');
        const strengthBar = page.locator('#passwordStrength .progress-bar');
        await (0, test_1.expect)(strengthBar).toHaveClass(/bg-danger/);
        await passwordInput.fill('StrongPassword123!');
        await (0, test_1.expect)(strengthBar).toHaveClass(/bg-success/);
    });
});
test_1.test.describe('Profile Management', () => {
    test_1.test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/');
    });
    (0, test_1.test)('should display user profile', async ({ page }) => {
        await page.click('.navbar-nav .dropdown-toggle');
        await page.click('a[href="/profile"]');
        await (0, test_1.expect)(page.locator('h1, h2')).toContainText('Perfil');
        await (0, test_1.expect)(page.locator('text=test@example.com')).toBeVisible();
    });
    (0, test_1.test)('should update profile successfully', async ({ page }) => {
        await page.click('.navbar-nav .dropdown-toggle');
        await page.click('a[href="/profile"]');
        await page.fill('input[name="name"]', 'Updated Name');
        await page.fill('input[name="avatar"]', 'https://example.com/avatar.jpg');
        await page.click('button[type="submit"]');
        await (0, test_1.expect)(page.locator('.alert-success')).toBeVisible();
        await (0, test_1.expect)(page.locator('.alert-success')).toContainText('Perfil atualizado com sucesso');
        await (0, test_1.expect)(page.locator('.navbar-nav .dropdown-toggle')).toContainText('Updated Name');
    });
    (0, test_1.test)('should logout successfully', async ({ page }) => {
        await page.click('.navbar-nav .dropdown-toggle');
        await page.click('a[onclick="logout()"]');
        await (0, test_1.expect)(page).toHaveURL('/login');
        await (0, test_1.expect)(page.locator('.navbar-nav .dropdown-toggle')).not.toBeVisible();
        await (0, test_1.expect)(page.locator('a[href="/login"]')).toBeVisible();
        await (0, test_1.expect)(page.locator('a[href="/register"]')).toBeVisible();
    });
});
test_1.test.describe('Responsive Design', () => {
    ['Desktop Chrome', 'Mobile Chrome'].forEach(deviceName => {
        (0, test_1.test)(`should work correctly on ${deviceName}`, async ({ page }) => {
            if (deviceName === 'Mobile Chrome') {
                await page.setViewportSize({ width: 375, height: 667 });
            }
            else {
                await page.setViewportSize({ width: 1280, height: 720 });
            }
            await page.goto('/login');
            await (0, test_1.expect)(page.locator('h3')).toBeVisible();
            await (0, test_1.expect)(page.locator('input[name="email"]')).toBeVisible();
            await (0, test_1.expect)(page.locator('input[name="password"]')).toBeVisible();
            await (0, test_1.expect)(page.locator('button[type="submit"]')).toBeVisible();
            await page.fill('input[name="email"]', 'test@example.com');
            await page.fill('input[name="password"]', 'password123');
            await page.click('button[type="submit"]');
            await (0, test_1.expect)(page).toHaveURL('/', { timeout: 10000 });
        });
    });
});
//# sourceMappingURL=auth.spec.js.map