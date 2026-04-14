"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseModel_1 = __importDefault(require("./BaseModel"));
class EventAttendee extends BaseModel_1.default {
}
EventAttendee.tableName = 'event_attendees';
EventAttendee.jsonSchema = {
    type: 'object',
    required: ['eventId', 'userId', 'status'],
    properties: {
        id: { type: 'string' },
        eventId: { type: 'string' },
        userId: { type: 'string' },
        status: { type: 'string', enum: ['registered', 'attended', 'cancelled'] },
        registeredAt: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
    },
};
EventAttendee.relationMappings = {
    event: {
        relation: BaseModel_1.default.BelongsToOneRelation,
        modelClass: require('./Event').default,
        join: {
            from: 'event_attendees.eventId',
            to: 'events.id',
        },
    },
    user: {
        relation: BaseModel_1.default.BelongsToOneRelation,
        modelClass: require('./User').default,
        join: {
            from: 'event_attendees.userId',
            to: 'users.id',
        },
    },
};
exports.default = EventAttendee;
//# sourceMappingURL=EventAttendee.js.map