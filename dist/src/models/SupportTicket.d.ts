import BaseModel from './BaseModel';
import { RelationMappings } from 'objection';
export default class SupportTicket extends BaseModel {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    userId: string;
    assignedTo?: string;
    response?: string;
    respondedAt?: string;
    static tableName: string;
    static jsonSchema: {
        type: string;
        required: string[];
        properties: {
            id: {
                type: string;
            };
            title: {
                type: string;
                minLength: number;
                maxLength: number;
            };
            description: {
                type: string;
                minLength: number;
            };
            status: {
                type: string;
                enum: string[];
                default: string;
            };
            priority: {
                type: string;
                enum: string[];
                default: string;
            };
            category: {
                type: string;
                minLength: number;
                maxLength: number;
            };
            userId: {
                type: string;
            };
            assignedTo: {
                type: string[];
            };
            response: {
                type: string[];
            };
            respondedAt: {
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
    static modifiers: {
        byStatus(builder: any, status: string): any;
        byPriority(builder: any, priority: string): any;
        byCategory(builder: any, category: string): any;
        byUser(builder: any, userId: string): any;
        byAssignedUser(builder: any, assignedTo: string): any;
        unassigned(builder: any): any;
        open(builder: any): any;
        resolved(builder: any): any;
        ordered(builder: any, order?: "asc" | "desc"): any;
        orderedByPriority(builder: any): any;
    };
    get isOpen(): boolean;
    get isResolved(): boolean;
    get hasResponse(): boolean;
    get priorityLevel(): number;
    get statusColor(): string;
    get priorityColor(): string;
}
//# sourceMappingURL=SupportTicket.d.ts.map