import BaseModel from './BaseModel';
import { RelationMappings, RelationMapping } from 'objection';
import { Model } from 'objection';

export type UserRole = 'admin' | 'core_team' | 'praxante' | 'student';

export default class User extends BaseModel {
  id!: string;
  name!: string;
  email!: string;
  password!: string;
  role!: UserRole;
  avatar?: string;
  isActive!: boolean;
  emailVerified!: boolean;
  googleId?: string;
  microsoftId?: string;
  lastLoginAt?: string;

  static tableName = 'users';

  static jsonSchema = {
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

  static relationMappings: RelationMappings = {
    supportTickets: {
      relation: Model.HasManyRelation,
      modelClass: require('./SupportTicket').default,
      join: {
        from: 'users.id',
        to: 'support_tickets.userId',
      },
    },
    eventAttendees: {
      relation: Model.HasManyRelation,
      modelClass: require('./EventAttendee').default,
      join: {
        from: 'users.id',
        to: 'event_attendees.userId',
      },
    },
  };

  // Hide password in JSON responses
  $formatJson(json: any) {
    json = super.$formatJson(json);
    delete json.password;
    return json;
  }
}
