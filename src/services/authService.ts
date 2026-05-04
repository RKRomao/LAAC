import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User';
import { CustomError } from '../middleware/errorHandler';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

class AuthService {
  private generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const { name, email, password, role = 'student' } = data;

    // Check if user already exists
    const existingUser = await User.query().findOne({ email });
    if (existingUser) {
      const error = new Error('User with this email already exists') as CustomError;
      error.statusCode = 400;
      throw error;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.query().insert({
      name,
      email,
      password: hashedPassword,
      role,
      is_active: true,
      email_verified: false,
    });

    // Generate token
    const token = this.generateToken(user.id);

    // Return user without password and token
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword as Omit<User, 'password'>,
      token,
    };
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Find user by email
    const user = await User.query().findOne({ email, isActive: true });
    if (!user) {
      const error = new Error('Invalid credentials') as CustomError;
      error.statusCode = 401;
      throw error;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const error = new Error('Invalid credentials') as CustomError;
      error.statusCode = 401;
      throw error;
    }

    // Update last login
    await User.query().findById(user.id).patch({
      lastLoginAt: new Date().toISOString(),
    });

    // Generate token
    const token = this.generateToken(user.id);

    // Return user without password and token
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword as Omit<User, 'password'>,
      token,
    };
  }

  async verifyToken(token: string): Promise<Omit<User, 'password'>> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
      
      const user = await User.query().findById(decoded.userId);
      if (!user || !user.is_active) {
        const error = new Error('User not found or inactive') as CustomError;
        error.statusCode = 401;
        throw error;
      }

      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as Omit<User, 'password'>;
    } catch (error) {
      const err = new Error('Invalid token') as CustomError;
      err.statusCode = 401;
      throw err;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.query().findById(userId);
    if (!user) {
      const error = new Error('User not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      const error = new Error('Current password is incorrect') as CustomError;
      error.statusCode = 400;
      throw error;
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.query().findById(userId).patch({
      password: hashedNewPassword,
    });
  }

  async updateProfile(userId: string, data: Partial<Pick<User, 'name' | 'avatar'>>): Promise<Omit<User, 'password'>> {
    const user = await User.query().patchAndFetchById(userId, data);
    if (!user) {
      const error = new Error('User not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'password'>;
  }
}

export default new AuthService();
