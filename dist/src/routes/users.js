"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/profile', (req, res) => {
    res.json({ message: 'Get user profile - to be implemented' });
});
router.put('/profile', (req, res) => {
    res.json({ message: 'Update user profile - to be implemented' });
});
router.get('/', (req, res) => {
    res.json({ message: 'Get all users - to be implemented' });
});
exports.default = router;
//# sourceMappingURL=users.js.map