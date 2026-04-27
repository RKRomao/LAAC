import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User';
import { Request } from 'express';

// Only initialize Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && 
    process.env.GOOGLE_CLIENT_SECRET && 
    process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id' &&
    process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret') {
  
  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: "/api/auth/google/callback",
    scope: ['profile', 'email']
  }, async (accessToken: any, refreshToken: any, profile: any, done: any) => {
    try {
      // Check if user already exists
      let user = await User.query().findOne({ email: profile.emails?.[0]?.value });
      
      if (user) {
        // User exists, update their Google info if needed
        if (!user.googleId) {
          await User.query()
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
      } else {
        // Create new user
        const newUser = await User.query().insert({
          email: profile.emails?.[0]?.value,
          name: profile.displayName,
          password: '', // OAuth users don't have passwords
          googleId: profile.id,
          avatar: profile.photos?.[0]?.value,
          role: 'student', // Default role for OAuth users
          isActive: true,
          emailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        return done(null, newUser);
      }
    } catch (error) {
      return done(error, undefined);
    }
  }));
}

// Serialize user for session
passport.serializeUser((user: any, done: any) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await User.query().findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
