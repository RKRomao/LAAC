"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseModel_1 = __importDefault(require("./BaseModel"));
class FAQ extends BaseModel_1.default {
}
FAQ.tableName = 'faqs';
FAQ.jsonSchema = {
    type: 'object',
    required: ['question', 'answer', 'category'],
    properties: {
        id: { type: 'string' },
        question: { type: 'string', minLength: 10, maxLength: 500 },
        answer: { type: 'string', minLength: 10 },
        category: { type: 'string', minLength: 2, maxLength: 100 },
        order: { type: 'integer', minimum: 0, default: 0 },
        isActive: { type: 'boolean', default: true },
        createdBy: { type: 'string' },
        updatedBy: { type: ['string', 'null'] },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
    },
};
FAQ.relationMappings = {
    creator: {
        relation: BaseModel_1.default.BelongsToOneRelation,
        modelClass: require('./User').default,
        join: {
            from: 'faqs.createdBy',
            to: 'users.id',
        },
    },
    updater: {
        relation: BaseModel_1.default.BelongsToOneRelation,
        modelClass: require('./User').default,
        join: {
            from: 'faqs.updatedBy',
            to: 'users.id',
        },
    },
};
FAQ.modifiers = {
    active(builder) {
        return builder.where('isActive', true);
    },
    ordered(builder) {
        return builder.orderBy('order', 'asc').orderBy('createdAt', 'desc');
    },
    byCategory(builder, category) {
        return builder.where('category', category);
    },
};
exports.default = FAQ;
//# sourceMappingURL=FAQ.js.map