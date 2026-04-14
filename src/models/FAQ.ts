import BaseModel from './BaseModel';
import { RelationMappings } from 'objection';

export default class FAQ extends BaseModel {
  id!: string;
  question!: string;
  answer!: string;
  category!: string;
  order!: number;
  isActive!: boolean;
  createdBy!: string;
  updatedBy?: string;

  static tableName = 'faqs';

  static jsonSchema = {
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

  static relationMappings: RelationMappings = {
    creator: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: require('./User').default,
      join: {
        from: 'faqs.createdBy',
        to: 'users.id',
      },
    },
    updater: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: require('./User').default,
      join: {
        from: 'faqs.updatedBy',
        to: 'users.id',
      },
    },
  };

  static modifiers = {
    active(builder: any) {
      return builder.where('isActive', true);
    },
    ordered(builder: any) {
      return builder.orderBy('order', 'asc').orderBy('createdAt', 'desc');
    },
    byCategory(builder: any, category: string) {
      return builder.where('category', category);
    },
  };
}
