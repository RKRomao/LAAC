import BaseModel from './BaseModel';
import { RelationMappings } from 'objection';

export default class Event extends BaseModel {
  id!: string;
  title!: string;
  description!: string;
  location!: string;
  startDate!: string;
  endDate!: string;
  imageUrl?: string;
  category!: string;
  maxAttendees?: number;
  isActive!: boolean;
  createdBy!: string;
  updatedBy?: string;
  attendees?: any[];

  static tableName = 'events';

  static jsonSchema = {
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

  static relationMappings: RelationMappings = {
    creator: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: require('./User').default,
      join: {
        from: 'events.createdBy',
        to: 'users.id',
      },
    },
    updater: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: require('./User').default,
      join: {
        from: 'events.updatedBy',
        to: 'users.id',
      },
    },
    attendees: {
      relation: BaseModel.HasManyRelation,
      modelClass: require('./EventAttendee').default,
      join: {
        from: 'events.id',
        to: 'event_attendees.eventId',
      },
    },
  };

  static modifiers = {
    active(builder: any) {
      return builder.where('isActive', true);
    },
    upcoming(builder: any) {
      return builder.where('startDate', '>', new Date().toISOString());
    },
    past(builder: any) {
      return builder.where('endDate', '<', new Date().toISOString());
    },
    byCategory(builder: any, category: string) {
      return builder.where('category', category);
    },
    byDateRange(builder: any, startDate: string, endDate: string) {
      return builder
        .where('startDate', '>=', startDate)
        .where('startDate', '<=', endDate);
    },
    ordered(builder: any, order: 'asc' | 'desc' = 'asc') {
      return builder.orderBy('startDate', order);
    },
  };

  // Virtual properties
  get isUpcoming(): boolean {
    return new Date(this.startDate) > new Date();
  }

  get isPast(): boolean {
    return new Date(this.endDate) < new Date();
  }

  get isOngoing(): boolean {
    const now = new Date();
    return new Date(this.startDate) <= now && new Date(this.endDate) >= now;
  }

  get formattedStartDate(): string {
    return new Date(this.startDate).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  get formattedEndDate(): string {
    return new Date(this.endDate).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  get attendeeCount(): number {
    return this.attendees?.length || 0;
  }

  get hasSpace(): boolean {
    if (!this.maxAttendees) return true;
    return this.attendeeCount < this.maxAttendees;
  }
}
