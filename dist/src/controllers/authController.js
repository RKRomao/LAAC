"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.changePassword = exports.updateProfile = exports.getProfile = exports.login = exports.register = void 0;
const authService_1 = __importDefault(require("../services/authService"));
const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        const result = await authService_1.default.register({
            name,
            email,
            password,
            role,
        });
        res.status(201).json({
            success: true,
            data: result,
            message: 'User registered successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService_1.default.login({
            email,
            password,
        });
        res.json({
            success: true,
            data: result,
            message: 'Login successful',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const getProfile = async (req, res, next) => {
    try {
        res.json({
            success: true,
            data: req.user,
            message: 'Profile retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res, next) => {
    try {
        const { name, avatar } = req.body;
        const userId = req.user.id;
        const updatedUser = await authService_1.default.updateProfile(userId, {
            name,
            avatar,
        });
        res.json({
            success: true,
            data: updatedUser,
            message: 'Profile updated successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        await authService_1.default.changePassword(userId, currentPassword, newPassword);
        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.changePassword = changePassword;
const logout = async (req, res, next) => {
    try {
        res.json({
            success: true,
            message: 'Logout successful',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
//# sourceMappingURL=authController.js.map