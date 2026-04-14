"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Event_1 = __importDefault(require("@/models/Event"));
const EventAttendee_1 = __importDefault(require("@/models/EventAttendee"));
class EventService {
    async getAllEvents(query = {}) {
        const { category, startDate, endDate, status, page = 1, limit = 50 } = query;
        let eventQuery = Event_1.default.query()
            .withGraphFetched('[creator(updater), attendees(user)]')
            .modify('active')
            .modify('ordered', 'asc');
        if (category) {
            eventQuery = eventQuery.modify('byCategory', category);
        }
        if (startDate && endDate) {
            eventQuery = eventQuery.modify('byDateRange', startDate, endDate);
        }
        if (status) {
            switch (status) {
                case 'upcoming':
                    eventQuery = eventQuery.modify('upcoming');
                    break;
                case 'past':
                    eventQuery = eventQuery.modify('past');
                    break;
                case 'ongoing':
                    const now = new Date().toISOString();
                    eventQuery = eventQuery
                        .where('startDate', '<=', now)
                        .where('endDate', '>=', now);
                    break;
            }
        }
        const total = await eventQuery.clone().resultSize();
        const offset = (page - 1) * limit;
        const events = await eventQuery.limit(limit).offset(offset);
        return {
            data: events,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getEventById(id) {
        const event = await Event_1.default.query()
            .findById(id)
            .withGraphFetched('[creator(updater), attendees(user)]')
            .modify('active');
        if (!event) {
            const error = new Error('Event not found');
            error.statusCode = 404;
            throw error;
        }
        return event;
    }
    async createEvent(data, userId) {
        const { title, description, location, startDate, endDate, imageUrl, category, maxAttendees, } = data;
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start >= end) {
            const error = new Error('Start date must be before end date');
            error.statusCode = 400;
            throw error;
        }
        if (start < new Date()) {
            const error = new Error('Start date cannot be in the past');
            error.statusCode = 400;
            throw error;
        }
        const event = await Event_1.default.query().insert({
            title,
            description,
            location,
            startDate,
            endDate,
            imageUrl,
            category,
            maxAttendees,
            createdBy: userId,
        });
        return await Event_1.default.query()
            .findById(event.id)
            .withGraphFetched('[creator]');
    }
    async updateEvent(id, data, userId) {
        const event = await Event_1.default.query().findById(id);
        if (!event) {
            const error = new Error('Event not found');
            error.statusCode = 404;
            throw error;
        }
        if (data.startDate || data.endDate) {
            const start = data.startDate ? new Date(data.startDate) : new Date(event.startDate);
            const end = data.endDate ? new Date(data.endDate) : new Date(event.endDate);
            if (start >= end) {
                const error = new Error('Start date must be before end date');
                error.statusCode = 400;
                throw error;
            }
        }
        const updatedEvent = await Event_1.default.query().patchAndFetchById(id, {
            ...data,
            updatedBy: userId,
        });
        return await Event_1.default.query()
            .findById(updatedEvent.id)
            .withGraphFetched('[creator(updater)]');
    }
    async deleteEvent(id) {
        const event = await Event_1.default.query().findById(id);
        if (!event) {
            const error = new Error('Event not found');
            error.statusCode = 404;
            throw error;
        }
        await Event_1.default.query().findById(id).patch({ isActive: false });
    }
    async getCategories() {
        const categories = await Event_1.default.query()
            .select('category')
            .where('isActive', true)
            .groupBy('category')
            .orderBy('category');
        return categories.map(cat => cat.category);
    }
    async registerForEvent(eventId, userId) {
        const event = await Event_1.default.query()
            .findById(eventId)
            .modify('active');
        if (!event) {
            const error = new Error('Event not found');
            error.statusCode = 404;
            throw error;
        }
        if (new Date(event.startDate) < new Date()) {
            const error = new Error('Cannot register for past events');
            error.statusCode = 400;
            throw error;
        }
        const existingRegistration = await EventAttendee_1.default.query()
            .where({ eventId, userId })
            .first();
        if (existingRegistration) {
            const error = new Error('Already registered for this event');
            error.statusCode = 400;
            throw error;
        }
        if (event.maxAttendees) {
            const currentAttendees = await EventAttendee_1.default.query()
                .where({ eventId, status: 'registered' })
                .resultSize();
            if (currentAttendees >= event.maxAttendees) {
                const error = new Error('Event is full');
                error.statusCode = 400;
                throw error;
            }
        }
        const registration = await EventAttendee_1.default.query().insert({
            eventId,
            userId,
            status: 'registered',
            registeredAt: new Date().toISOString(),
        });
        return await EventAttendee_1.default.query()
            .findById(registration.id)
            .withGraphFetched('[event, user]');
    }
    async unregisterFromEvent(eventId, userId) {
        const registration = await EventAttendee_1.default.query()
            .where({ eventId, userId })
            .first();
        if (!registration) {
            const error = new Error('Not registered for this event');
            error.statusCode = 404;
            throw error;
        }
        const event = await Event_1.default.query().findById(eventId);
        if (event && new Date(event.startDate) < new Date()) {
            const error = new Error('Cannot unregister from events that have started');
            error.statusCode = 400;
            throw error;
        }
        await EventAttendee_1.default.query()
            .findById(registration.id)
            .patch({ status: 'cancelled' });
    }
    async getEventAttendees(eventId) {
        const event = await Event_1.default.query().findById(eventId);
        if (!event) {
            const error = new Error('Event not found');
            error.statusCode = 404;
            throw error;
        }
        const attendees = await EventAttendee_1.default.query()
            .where({ eventId, status: 'registered' })
            .withGraphFetched('[user]')
            .orderBy('registeredAt', 'asc');
        return attendees;
    }
    async getUserEvents(userId, status) {
        let attendeeQuery = EventAttendee_1.default.query()
            .where({ userId, status: 'registered' })
            .withGraphFetched('[event]');
        const registrations = await attendeeQuery;
        let filteredRegistrations = registrations;
        if (status && status !== 'all') {
            const now = new Date().toISOString();
            filteredRegistrations = registrations.filter(reg => {
                if (!reg.event)
                    return false;
                if (status === 'upcoming') {
                    return reg.event.startDate > now;
                }
                else {
                    return reg.event.endDate < now;
                }
            });
        }
        return filteredRegistrations.map(reg => ({
            ...reg.event,
            registrationStatus: reg.status,
            registeredAt: reg.registeredAt,
        }));
    }
    async getUpcomingEvents(limit = 10) {
        const events = await Event_1.default.query()
            .modify('active')
            .modify('upcoming')
            .modify('ordered', 'asc')
            .limit(limit)
            .withGraphFetched('[creator]');
        return events;
    }
    async getPastEvents(limit = 10) {
        const events = await Event_1.default.query()
            .modify('active')
            .modify('past')
            .modify('ordered', 'desc')
            .limit(limit)
            .withGraphFetched('[creator]');
        return events;
    }
}
exports.default = new EventService();
//# sourceMappingURL=eventService.js.map