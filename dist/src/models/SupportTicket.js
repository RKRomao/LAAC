"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseModel_1 = __importDefault(require("./BaseModel"));
class SupportTicket extends BaseModel_1.default {
    get isOpen() {
        return this.status === 'open' || this.status === 'in_progress';
    }
    get isResolved() {
        return this.status === 'resolved' || this.status === 'closed';
    }
    get hasResponse() {
        return !!this.response;
    }
    get priorityLevel() {
        const levels = { urgent: 1, high: 2, medium: 3, low: 4 };
        return levels[this.priority];
    }
    get statusColor() {
        const colors = {
            open: 'warning',
            in_progress: 'info',
            resolved: 'success',
            closed: 'secondary'
        };
        return colors[this.status];
    }
    get priorityColor() {
        const colors = {
            urgent: 'danger',
            high: 'warning',
            medium: 'info',
            low: 'success'
        };
        return colors[this.priority];
    }
}
SupportTicket.tableName = 'support_tickets';
SupportTicket.jsonSchema = {
    type: 'object',
    required: ['title', 'description', 'category', 'userId'],
    properties: {
        id: { type: 'string' },
        title: { type: 'string', minLength: 3, maxLength: 200 },
        description: { type: 'string', minLength: 10 },
        status: { type: 'string', enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
        category: { type: 'string', minLength: 2, maxLength: 100 },
        userId: { type: 'string' },
        assignedTo: { type: ['string', 'null'] },
        response: { type: ['string', 'null'] },
        respondedAt: { type: ['string', 'null'] },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
    },
};
SupportTicket.relationMappings = {
    user: {
        relation: BaseModel_1.default.BelongsToOneRelation,
        modelClass: require('./User').default,
        join: {
            from: 'support_tickets.userId',
            to: 'users.id',
        },
    },
    assignedUser: {
        relation: BaseModel_1.default.BelongsToOneRelation,
        modelClass: require('./User').default,
        join: {
            from: 'support_tickets.assignedTo',
            to: 'users.id',
        },
    },
};
SupportTicket.modifiers = {
    byStatus(builder, status) {
        return builder.where('status', status);
    },
    byPriority(builder, priority) {
        return builder.where('priority', priority);
    },
    byCategory(builder, category) {
        return builder.where('category', category);
    },
    byUser(builder, userId) {
        return builder.where('userId', userId);
    },
    byAssignedUser(builder, assignedTo) {
        return builder.where('assignedTo', assignedTo);
    },
    unassigned(builder) {
        return builder.whereNull('assignedTo');
    },
    open(builder) {
        return builder.where('status', 'in', ['open', 'in_progress']);
    },
    resolved(builder) {
        return builder.where('status', 'in', ['resolved', 'closed']);
    },
    ordered(builder, order = 'desc') {
        return builder.orderBy('createdAt', order);
    },
    orderedByPriority(builder) {
        return builder.orderByRaw(`
        CASE priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END
      `);
    },
};
exports.default = SupportTicket;
//# sourceMappingURL=SupportTicket.js.map