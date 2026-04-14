"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const options = {
    host: 'localhost',
    port: process.env.PORT || 3000,
    path: '/health',
    timeout: 2000,
};
const request = http_1.default.request(options, (res) => {
    console.log(`Health check status: ${res.statusCode}`);
    if (res.statusCode === 200) {
        process.exit(0);
    }
    else {
        process.exit(1);
    }
});
request.on('error', (err) => {
    console.log('Health check failed:', err.message);
    process.exit(1);
});
request.on('timeout', () => {
    console.log('Health check timeout');
    request.destroy();
    process.exit(1);
});
request.end();
//# sourceMappingURL=healthcheck.js.map