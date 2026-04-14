import BaseModel from './BaseModel';
import { RelationMappings } from 'objection';
export default class EventAttendee extends BaseModel {
    id: string;
    eventId: string;
    userId: string;
    status: 'registered' | 'attended' | 'cancelled';
    registeredAt: string;
    event?: any;
    static tableName: string;
    static jsonSchema: {
        type: string;
        required: string[];
        properties: {
            id: {
                type: string;
            };
            eventId: {
                type: string;
            };
            userId: {
                type: string;
            };
            status: {
                type: string;
                enum: string[];
            };
            registeredAt: {
                type: string;
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
}
//# sourceMappingURL=EventAttendee.d.ts.map