"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const User_1 = __importDefault(require("../models/User"));
if (process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id' &&
    process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret') {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
        scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User_1.default.query().findOne({ email: profile.emails?.[0]?.value });
            if (user) {
                if (!user.googleId) {
                    await User_1.default.query()
                        .findById(user.id)
                        .patch({
                        googleId: profile.id,
                        avatar: profile.photos?.[0]?.value || user.avatar,
                        emailVerified: true,
                        lastLoginAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                }
                return done(null, user);
            }
            else {
                const newUser = await User_1.default.query().insert({
                    email: profile.emails?.[0]?.value,
                    name: profile.displayName,
                    password: '',
                    googleId: profile.id,
                    avatar: profile.photos?.[0]?.value,
                    role: 'student',
                    isActive: true,
                    emailVerified: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                return done(null, newUser);
            }
        }
        catch (error) {
            return done(error, undefined);
        }
    }));
}
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await User_1.default.query().findById(id);
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
exports.default = passport_1.default;
//# sourceMappingURL=passport.js.map