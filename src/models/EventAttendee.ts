import BaseModel from './BaseModel';
import { RelationMappings } from 'objection';

export default class EventAttendee extends BaseModel {
  id!: string;
  eventId!: string;
  userId!: string;
  status!: 'registered' | 'attended' | 'cancelled';
  registeredAt!: string;
  event?: any;

  static tableName = 'event_attendees';

  static jsonSchema = {
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

  static relationMappings: RelationMappings = {
    event: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: require('./Event').default,
      join: {
        from: 'event_attendees.eventId',
        to: 'events.id',
      },
    },
    user: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: require('./User').default,
      join: {
        from: 'event_attendees.userId',
        to: 'users.id',
      },
    },
  };
}
