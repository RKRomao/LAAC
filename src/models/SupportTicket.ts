import BaseModel from './BaseModel';
import { RelationMappings } from 'objection';

export default class SupportTicket extends BaseModel {
  id!: string;
  title!: string;
  description!: string;
  status!: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority!: 'low' | 'medium' | 'high' | 'urgent';
  category!: string;
  userId!: string;
  assignedTo?: string;
  response?: string;
  respondedAt?: string;

  static tableName = 'support_tickets';

  static jsonSchema = {
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

  static relationMappings: RelationMappings = {
    user: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: require('./User').default,
      join: {
        from: 'support_tickets.userId',
        to: 'users.id',
      },
    },
    assignedUser: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: require('./User').default,
      join: {
        from: 'support_tickets.assignedTo',
        to: 'users.id',
      },
    },
  };

  static modifiers = {
    byStatus(builder: any, status: string) {
      return builder.where('status', status);
    },
    byPriority(builder: any, priority: string) {
      return builder.where('priority', priority);
    },
    byCategory(builder: any, category: string) {
      return builder.where('category', category);
    },
    byUser(builder: any, userId: string) {
      return builder.where('userId', userId);
    },
    byAssignedUser(builder: any, assignedTo: string) {
      return builder.where('assignedTo', assignedTo);
    },
    unassigned(builder: any) {
      return builder.whereNull('assignedTo');
    },
    open(builder: any) {
      return builder.where('status', 'in', ['open', 'in_progress']);
    },
    resolved(builder: any) {
      return builder.where('status', 'in', ['resolved', 'closed']);
    },
    ordered(builder: any, order: 'asc' | 'desc' = 'desc') {
      return builder.orderBy('createdAt', order);
    },
    orderedByPriority(builder: any) {
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

  // Virtual properties
  get isOpen(): boolean {
    return this.status === 'open' || this.status === 'in_progress';
  }

  get isResolved(): boolean {
    return this.status === 'resolved' || this.status === 'closed';
  }

  get hasResponse(): boolean {
    return !!this.response;
  }

  get priorityLevel(): number {
    const levels = { urgent: 1, high: 2, medium: 3, low: 4 };
    return levels[this.priority];
  }

  get statusColor(): string {
    const colors = {
      open: 'warning',
      in_progress: 'info',
      resolved: 'success',
      closed: 'secondary'
    };
    return colors[this.status];
  }

  get priorityColor(): string {
    const colors = {
      urgent: 'danger',
      high: 'warning',
      medium: 'info',
      low: 'success'
    };
    return colors[this.priority];
  }
}
