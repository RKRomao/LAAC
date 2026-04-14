"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const authController_1 = require("@/controllers/authController");
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/middleware/validation");
const router = (0, express_1.Router)();
const registerValidation = [
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('role')
        .optional()
        .isIn(['admin', 'core_team', 'praxante', 'student'])
        .withMessage('Invalid role'),
];
const loginValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required'),
];
const updateProfileValidation = [
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('avatar')
        .optional()
        .isURL()
        .withMessage('Avatar must be a valid URL'),
];
const changePasswordValidation = [
    (0, express_validator_1.body)('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long'),
];
router.post('/register', registerValidation, validation_1.validate, authController_1.register);
router.post('/login', loginValidation, validation_1.validate, authController_1.login);
router.get('/profile', auth_1.authenticate, authController_1.getProfile);
router.put('/profile', auth_1.authenticate, updateProfileValidation, validation_1.validate, authController_1.updateProfile);
router.put('/change-password', auth_1.authenticate, changePasswordValidation, validation_1.validate, authController_1.changePassword);
router.post('/logout', auth_1.authenticate, authController_1.logout);
router.get('/google', (req, res) => {
    res.json({ message: 'Google OAuth endpoint - to be implemented' });
});
router.get('/microsoft', (req, res) => {
    res.json({ message: 'Microsoft OAuth endpoint - to be implemented' });
});
exports.default = router;
//# sourceMappingURL=auth.js.map