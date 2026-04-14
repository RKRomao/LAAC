"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.knex = void 0;
exports.createTestUser = createTestUser;
exports.createTestFAQ = createTestFAQ;
exports.createTestEvent = createTestEvent;
exports.createTestSupportTicket = createTestSupportTicket;
exports.createTestLocation = createTestLocation;
const globals_1 = require("@jest/globals");
const knexfile_1 = __importDefault(require("../src/knexfile"));
let knex;
(0, globals_1.beforeAll)(async () => {
    const testConfig = knexfile_1.default.test;
    exports.knex = knex = require('knex')(testConfig);
    await knex.migrate.latest();
});
(0, globals_1.afterAll)(async () => {
    await knex.destroy();
});
(0, globals_1.beforeEach)(async () => {
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
(0, globals_1.afterEach)(async () => {
});
async function createTestUser(userData = {}) {
    const defaultUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: '$2b$10$rOzJqQjQjQjQjQjQjQjQu',
        role: 'student',
    };
    const [user] = await knex('users').insert({ ...defaultUser, ...userData }).returning('*');
    return user;
}
async function createTestFAQ(faqData = {}) {
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
async function createTestEvent(eventData = {}) {
    const defaultEvent = {
        title: 'Test Event',
        description: 'Test Description',
        location: 'Test Location',
        start_date: new Date(Date.now() + 86400000).toISOString(),
        end_date: new Date(Date.now() + 172800000).toISOString(),
        category: 'Test Category',
        is_active: true,
    };
    const [event] = await knex('events').insert({ ...defaultEvent, ...eventData }).returning('*');
    return event;
}
async function createTestSupportTicket(ticketData = {}) {
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
async function createTestLocation(locationData = {}) {
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
//# sourceMappingURL=setup.js.map