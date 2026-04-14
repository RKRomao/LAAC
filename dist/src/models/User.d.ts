import BaseModel from './BaseModel';
import { RelationMappings } from 'objection';
export type UserRole = 'admin' | 'core_team' | 'praxante' | 'student';
export default class User extends BaseModel {
    id: string;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    avatar?: string;
    isActive: boolean;
    emailVerified: boolean;
    googleId?: string;
    microsoftId?: string;
    lastLoginAt?: string;
    static tableName: string;
    static jsonSchema: {
        type: string;
        required: string[];
        properties: {
            id: {
                type: string;
            };
            name: {
                type: string;
                minLength: number;
                maxLength: number;
            };
            email: {
                type: string;
                format: string;
            };
            password: {
                type: string;
                minLength: number;
            };
            role: {
                type: string;
                enum: string[];
                default: string;
            };
            avatar: {
                type: string[];
            };
            isActive: {
                type: string;
                default: boolean;
            };
            emailVerified: {
                type: string;
                default: boolean;
            };
            googleId: {
                type: string[];
            };
            microsoftId: {
                type: string[];
            };
            lastLoginAt: {
                type: string[];
            };
            createdAt: {
                type: string;
            };
            updatedAt: {
                type: string;
            };
        };
    };
    static relationMappings: RelationMappings;
    $formatJson(json: any): any;
}
//# sourceMappingURL=User.d.ts.map