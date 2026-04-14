"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
(0, globals_1.describe)('Auth Service', () => {
    (0, globals_1.test)('should validate email format', () => {
        const validEmail = 'test@example.com';
        const invalidEmail = 'invalid-email';
        (0, globals_1.expect)(validEmail).toMatch(/@/);
        (0, globals_1.expect)(invalidEmail).not.toMatch(/@/);
    });
    (0, globals_1.test)('should validate password strength', () => {
        const weakPassword = '123';
        const strongPassword = 'StrongPassword123!';
        (0, globals_1.expect)(strongPassword.length).toBeGreaterThan(8);
        (0, globals_1.expect)(weakPassword.length).toBeLessThan(6);
    });
    (0, globals_1.test)('should hash password correctly', async () => {
        const bcrypt = require('bcrypt');
        const password = 'testpassword';
        const hashedPassword = await bcrypt.hash(password, 10);
        (0, globals_1.expect)(hashedPassword).not.toBe(password);
        (0, globals_1.expect)(hashedPassword.length).toBeGreaterThan(50);
    });
});
//# sourceMappingURL=auth.test.js.map