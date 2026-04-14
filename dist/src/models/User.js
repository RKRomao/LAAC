"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseModel_1 = __importDefault(require("./BaseModel"));
const objection_1 = require("objection");
class User extends BaseModel_1.default {
    $formatJson(json) {
        json = super.$formatJson(json);
        delete json.password;
        return json;
    }
}
User.tableName = 'users';
User.jsonSchema = {
    type: 'object',
    required: ['name', 'email', 'password', 'role'],
    properties: {
        id: { type: 'string' },
        name: { type: 'string', minLength: 2, maxLength: 100 },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
        role: {
            type: 'string',
            enum: ['admin', 'core_team', 'praxante', 'student'],
            default: 'student'
        },
        avatar: { type: ['string', 'null'] },
        isActive: { type: 'boolean', default: true },
        emailVerified: { type: 'boolean', default: false },
        googleId: { type: ['string', 'null'] },
        microsoftId: { type: ['string', 'null'] },
        lastLoginAt: { type: ['string', 'null'] },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
    },
};
User.relationMappings = {
    supportTickets: {
        relation: objection_1.Model.HasManyRelation,
        modelClass: require('./SupportTicket').default,
        join: {
            from: 'users.id',
            to: 'support_tickets.userId',
        },
    },
    eventAttendees: {
        relation: objection_1.Model.HasManyRelation,
        modelClass: require('./EventAttendee').default,
        join: {
            from: 'users.id',
            to: 'event_attendees.userId',
        },
    },
};
exports.default = User;
//# sourceMappingURL=User.js.map