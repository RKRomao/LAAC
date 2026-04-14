import BaseModel from './BaseModel';
import { RelationMappings } from 'objection';
export default class Event extends BaseModel {
    id: string;
    title: string;
    description: string;
    location: string;
    startDate: string;
    endDate: string;
    imageUrl?: string;
    category: string;
    maxAttendees?: number;
    isActive: boolean;
    createdBy: string;
    updatedBy?: string;
    attendees?: any[];
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
            location: {
                type: string;
                minLength: number;
                maxLength: number;
            };
            startDate: {
                type: string;
                format: string;
            };
            endDate: {
                type: string;
                format: string;
            };
            imageUrl: {
                type: string[];
                maxLength: number;
            };
            category: {
                type: string;
                minLength: number;
                maxLength: number;
            };
            maxAttendees: {
                type: string[];
                minimum: number;
            };
            isActive: {
                type: string;
                default: boolean;
            };
            createdBy: {
                type: string;
            };
            updatedBy: {
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
        active(builder: any): any;
        upcoming(builder: any): any;
        past(builder: any): any;
        byCategory(builder: any, category: string): any;
        byDateRange(builder: any, startDate: string, endDate: string): any;
        ordered(builder: any, order?: "asc" | "desc"): any;
    };
    get isUpcoming(): boolean;
    get isPast(): boolean;
    get isOngoing(): boolean;
    get formattedStartDate(): string;
    get formattedEndDate(): string;
    get attendeeCount(): number;
    get hasSpace(): boolean;
}
//# sourceMappingURL=Event.d.ts.map