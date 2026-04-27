"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
class AuthService {
    generateToken(userId) {
        return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    }
    async register(data) {
        const { name, email, password, role = 'student' } = data;
        const existingUser = await User_1.default.query().findOne({ email });
        if (existingUser) {
            const error = new Error('User with this email already exists');
            error.statusCode = 400;
            throw error;
        }
        const saltRounds = 12;
        const hashedPassword = await bcrypt_1.default.hash(password, saltRounds);
        const user = await User_1.default.query().insert({
            name,
            email,
            password: hashedPassword,
            role,
            isActive: true,
            emailVerified: false,
        });
        const token = this.generateToken(user.id);
        const { password: _, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            token,
        };
    }
    async login(credentials) {
        const { email, password } = credentials;
        const user = await User_1.default.query().findOne({ email, isActive: true });
        if (!user) {
            const error = new Error('Invalid credentials');
            error.statusCode = 401;
            throw error;
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            const error = new Error('Invalid credentials');
            error.statusCode = 401;
            throw error;
        }
        await User_1.default.query().findById(user.id).patch({
            lastLoginAt: new Date().toISOString(),
        });
        const token = this.generateToken(user.id);
        const { password: _, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            token,
        };
    }
    async verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback-secret');
            const user = await User_1.default.query().findById(decoded.userId);
            if (!user || !user.isActive) {
                const error = new Error('User not found or inactive');
                error.statusCode = 401;
                throw error;
            }
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        catch (error) {
            const err = new Error('Invalid token');
            err.statusCode = 401;
            throw err;
        }
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await User_1.default.query().findById(userId);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        const isCurrentPasswordValid = await bcrypt_1.default.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            const error = new Error('Current password is incorrect');
            error.statusCode = 400;
            throw error;
        }
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt_1.default.hash(newPassword, saltRounds);
        await User_1.default.query().findById(userId).patch({
            password: hashedNewPassword,
        });
    }
    async updateProfile(userId, data) {
        const user = await User_1.default.query().patchAndFetchById(userId, data);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}
exports.default = new AuthService();
//# sourceMappingURL=authService.js.map