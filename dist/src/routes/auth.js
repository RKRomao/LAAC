"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const passport_1 = __importDefault(require("../config/passport"));
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
const forgotPasswordValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
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
router.post('/forgot-password', forgotPasswordValidation, validation_1.validate, async (req, res) => {
    try {
        const { email } = req.body;
        const User = (await Promise.resolve().then(() => __importStar(require('@/models/User')))).default;
        const user = await User.query().findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Este email não está registado na nossa base de dados.'
            });
        }
        res.json({
            success: true,
            message: `Email de recuperação enviado para ${email}. Verifique a sua caixa de entrada e spam.`
        });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            error: 'Ocorreu um erro ao processar o seu pedido. Tente novamente.'
        });
    }
});
router.get('/profile', auth_1.authenticate, authController_1.getProfile);
router.put('/profile', auth_1.authenticate, updateProfileValidation, validation_1.validate, authController_1.updateProfile);
router.put('/change-password', auth_1.authenticate, changePasswordValidation, validation_1.validate, authController_1.changePassword);
router.post('/logout', auth_1.authenticate, authController_1.logout);
router.get('/google', (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID ||
        !process.env.GOOGLE_CLIENT_SECRET ||
        process.env.GOOGLE_CLIENT_ID === 'your-google-client-id' ||
        process.env.GOOGLE_CLIENT_SECRET === 'your-google-client-secret') {
        return res.status(503).json({
            message: 'Google OAuth não está configurado. Por favor, configure as credenciais do Google OAuth no arquivo .env'
        });
    }
    passport_1.default.authenticate('google')(req, res);
    return;
});
router.get('/google/callback', (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID ||
        !process.env.GOOGLE_CLIENT_SECRET ||
        process.env.GOOGLE_CLIENT_ID === 'your-google-client-id' ||
        process.env.GOOGLE_CLIENT_SECRET === 'your-google-client-secret') {
        return res.status(503).json({
            message: 'Google OAuth não está configurado'
        });
    }
    passport_1.default.authenticate('google', { failureRedirect: '/login' })(req, res, (err) => {
        if (!err) {
            res.redirect('/dashboard');
        }
        else {
            res.redirect('/login');
        }
    });
    return;
});
router.get('/microsoft', (req, res) => {
    res.json({ message: 'Microsoft OAuth endpoint - to be implemented' });
});
exports.default = router;
//# sourceMappingURL=auth.js.map