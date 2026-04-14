"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
(0, globals_1.describe)('Simple Tests', () => {
    (0, globals_1.test)('should pass a basic test', () => {
        (0, globals_1.expect)(1 + 1).toBe(2);
    });
    (0, globals_1.test)('should handle async operations', async () => {
        const result = await Promise.resolve(42);
        (0, globals_1.expect)(result).toBe(42);
    });
    (0, globals_1.test)('should validate email format', () => {
        const email = 'test@example.com';
        (0, globals_1.expect)(email).toMatch(/@/);
    });
});
//# sourceMappingURL=simple.test.js.map