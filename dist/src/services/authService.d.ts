import User, { UserRole } from '@/models/User';
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
declare class AuthService {
    private generateToken;
    register(data: RegisterData): Promise<AuthResponse>;
    login(credentials: LoginCredentials): Promise<AuthResponse>;
    verifyToken(token: string): Promise<Omit<User, 'password'>>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    updateProfile(userId: string, data: Partial<Pick<User, 'name' | 'avatar'>>): Promise<Omit<User, 'password'>>;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=authService.d.ts.map