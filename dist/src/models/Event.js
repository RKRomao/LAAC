"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseModel_1 = __importDefault(require("./BaseModel"));
class Event extends BaseModel_1.default {
    get isUpcoming() {
        return new Date(this.startDate) > new Date();
    }
    get isPast() {
        return new Date(this.endDate) < new Date();
    }
    get isOngoing() {
        const now = new Date();
        return new Date(this.startDate) <= now && new Date(this.endDate) >= now;
    }
    get formattedStartDate() {
        return new Date(this.startDate).toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }
    get formattedEndDate() {
        return new Date(this.endDate).toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }
    get attendeeCount() {
        return this.attendees?.length || 0;
    }
    get hasSpace() {
        if (!this.maxAttendees)
            return true;
        return this.attendeeCount < this.maxAttendees;
    }
}
Event.tableName = 'events';
Event.jsonSchema = {
    type: 'object',
    required: ['title', 'description', 'location', 'startDate', 'endDate', 'category'],
    properties: {
        id: { type: 'string' },
        title: { type: 'string', minLength: 3, maxLength: 200 },
        description: { type: 'string', minLength: 10 },
        location: { type: 'string', minLength: 3, maxLength: 255 },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        imageUrl: { type: ['string', 'null'], maxLength: 255 },
        category: { type: 'string', minLength: 2, maxLength: 100 },
        maxAttendees: { type: ['integer', 'null'], minimum: 1 },
        isActive: { type: 'boolean', default: true },
        createdBy: { type: 'string' },
        updatedBy: { type: ['string', 'null'] },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
    },
};
Event.relationMappings = {
    creator: {
        relation: BaseModel_1.default.BelongsToOneRelation,
        modelClass: require('./User').default,
        join: {
            from: 'events.createdBy',
            to: 'users.id',
        },
    },
    updater: {
        relation: BaseModel_1.default.BelongsToOneRelation,
        modelClass: require('./User').default,
        join: {
            from: 'events.updatedBy',
            to: 'users.id',
        },
    },
    attendees: {
        relation: BaseModel_1.default.HasManyRelation,
        modelClass: require('./EventAttendee').default,
        join: {
            from: 'events.id',
            to: 'event_attendees.eventId',
        },
    },
};
Event.modifiers = {
    active(builder) {
        return builder.where('isActive', true);
    },
    upcoming(builder) {
        return builder.where('startDate', '>', new Date().toISOString());
    },
    past(builder) {
        return builder.where('endDate', '<', new Date().toISOString());
    },
    byCategory(builder, category) {
        return builder.where('category', category);
    },
    byDateRange(builder, startDate, endDate) {
        return builder
            .where('startDate', '>=', startDate)
            .where('startDate', '<=', endDate);
    },
    ordered(builder, order = 'asc') {
        return builder.orderBy('startDate', order);
    },
};
exports.default = Event;
//# sourceMappingURL=Event.js.map