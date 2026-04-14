import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { Knex } from 'knex';
import knexConfig from '../src/knexfile';

let knex: Knex;

beforeAll(async () => {
  // Initialize test database connection
  const testConfig = knexConfig.test;
  knex = require('knex')(testConfig);
  
  // Run migrations
  await knex.migrate.latest();
});

afterAll(async () => {
  // Clean up test database
  await knex.destroy();
});

beforeEach(async () => {
  // Clean up tables before each test
  const tables = [
    'event_attendees',
    'support_tickets',
    'locations',
    'events',
    'faqs',
    'users'
  ];
  
  for (const table of tables) {
    await knex(table).del();
  }
});

afterEach(async () => {
  // Clean up any remaining test data
  // This is handled by beforeEach but added as safety
});

// Export knex for use in tests
export { knex };

// Helper function to create test user
export async function createTestUser(userData: Partial<any> = {}) {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: '$2b$10$rOzJqQjQjQjQjQjQjQjQu', // password: test123
    role: 'student',
  };
  
  const [user] = await knex('users').insert({ ...defaultUser, ...userData }).returning('*');
  return user;
}

// Helper function to create test FAQ
export async function createTestFAQ(faqData: Partial<any> = {}) {
  const defaultFAQ = {
    question: 'Test Question',
    answer: 'Test Answer',
    category: 'Test Category',
    order: 1,
    is_active: true,
  };
  
  const [faq] = await knex('faqs').insert({ ...defaultFAQ, ...faqData }).returning('*');
  return faq;
}

// Helper function to create test event
export async function createTestEvent(eventData: Partial<any> = {}) {
  const defaultEvent = {
    title: 'Test Event',
    description: 'Test Description',
    location: 'Test Location',
    start_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    end_date: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
    category: 'Test Category',
    is_active: true,
  };
  
  const [event] = await knex('events').insert({ ...defaultEvent, ...eventData }).returning('*');
  return event;
}

// Helper function to create test support ticket
export async function createTestSupportTicket(ticketData: Partial<any> = {}) {
  const defaultTicket = {
    title: 'Test Ticket',
    description: 'Test Description',
    category: 'Test Category',
    status: 'open',
    priority: 'medium',
  };
  
  const [ticket] = await knex('support_tickets').insert({ ...defaultTicket, ...ticketData }).returning('*');
  return ticket;
}

// Helper function to create test location
export async function createTestLocation(locationData: Partial<any> = {}) {
  const defaultLocation = {
    name: 'Test Location',
    description: 'Test Description',
    address: 'Test Address',
    coordinates: 'POINT(-7.5049 40.2818)',
    category: 'Test Category',
    is_active: true,
  };
  
  const [location] = await knex('locations').insert({ ...defaultLocation, ...locationData }).returning('*');
  return location;
}
