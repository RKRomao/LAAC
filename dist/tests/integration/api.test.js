"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const server_1 = __importDefault(require("../../src/server"));
(0, globals_1.describe)('API Integration Tests', () => {
    (0, globals_1.test)('should respond to health check', async () => {
        const response = await (0, supertest_1.default)(server_1.default)
            .get('/health')
            .expect(200);
        (0, globals_1.expect)(response.body.status).toBe('OK');
        (0, globals_1.expect)(response.body).toHaveProperty('timestamp');
    });
    (0, globals_1.test)('should serve home page', async () => {
        const response = await (0, supertest_1.default)(server_1.default)
            .get('/')
            .expect(200);
        (0, globals_1.expect)(response.text).toContain('LAAC');
    });
    (0, globals_1.test)('should serve login page', async () => {
        const response = await (0, supertest_1.default)(server_1.default)
            .get('/login')
            .expect(200);
        (0, globals_1.expect)(response.text).toContain('Login');
    });
    (0, globals_1.test)('should return 404 for non-existent routes', async () => {
        const response = await (0, supertest_1.default)(server_1.default)
            .get('/non-existent-route')
            .expect(404);
    });
});
//# sourceMappingURL=api.test.js.map