import Event from '@/models/Event';
import EventAttendee from '@/models/EventAttendee';
import { CustomError } from '@/middleware/errorHandler';

export interface CreateEventData {
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  category: string;
  maxAttendees?: number;
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  imageUrl?: string;
  category?: string;
  maxAttendees?: number;
  isActive?: boolean;
}

export interface EventQuery {
  category?: string;
  startDate?: string;
  endDate?: string;
  status?: 'upcoming' | 'past' | 'ongoing';
  page?: number;
  limit?: number;
}

class EventService {
  async getAllEvents(query: EventQuery = {}) {
    const { category, startDate, endDate, status, page = 1, limit = 50 } = query;

    let eventQuery = Event.query()
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
          // For ongoing events, we need to check both start and end dates
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

  async getEventById(id: string) {
    const event = await Event.query()
      .findById(id)
      .withGraphFetched('[creator(updater), attendees(user)]')
      .modify('active');

    if (!event) {
      const error = new Error('Event not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    return event;
  }

  async createEvent(data: CreateEventData, userId: string) {
    const {
      title,
      description,
      location,
      startDate,
      endDate,
      imageUrl,
      category,
      maxAttendees,
    } = data;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      const error = new Error('Start date must be before end date') as CustomError;
      error.statusCode = 400;
      throw error;
    }

    if (start < new Date()) {
      const error = new Error('Start date cannot be in the past') as CustomError;
      error.statusCode = 400;
      throw error;
    }

    const event = await Event.query().insert({
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

    return await Event.query()
      .findById(event.id)
      .withGraphFetched('[creator]');
  }

  async updateEvent(id: string, data: UpdateEventData, userId: string) {
    const event = await Event.query().findById(id);
    
    if (!event) {
      const error = new Error('Event not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    // Validate dates if provided
    if (data.startDate || data.endDate) {
      const start = data.startDate ? new Date(data.startDate) : new Date(event.startDate);
      const end = data.endDate ? new Date(data.endDate) : new Date(event.endDate);

      if (start >= end) {
        const error = new Error('Start date must be before end date') as CustomError;
        error.statusCode = 400;
        throw error;
      }
    }

    const updatedEvent = await Event.query().patchAndFetchById(id, {
      ...data,
      updatedBy: userId,
    });

    return await Event.query()
      .findById(updatedEvent.id)
      .withGraphFetched('[creator(updater)]');
  }

  async deleteEvent(id: string) {
    const event = await Event.query().findById(id);
    
    if (!event) {
      const error = new Error('Event not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    // Soft delete - set isActive to false
    await Event.query().findById(id).patch({ isActive: false });
  }

  async getCategories() {
    const categories = await Event.query()
      .select('category')
      .where('isActive', true)
      .groupBy('category')
      .orderBy('category');

    return categories.map(cat => cat.category);
  }

  async registerForEvent(eventId: string, userId: string) {
    const event = await Event.query()
      .findById(eventId)
      .modify('active');

    if (!event) {
      const error = new Error('Event not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    // Check if event is in the past
    if (new Date(event.startDate) < new Date()) {
      const error = new Error('Cannot register for past events') as CustomError;
      error.statusCode = 400;
      throw error;
    }

    // Check if user is already registered
    const existingRegistration = await EventAttendee.query()
      .where({ eventId, userId })
      .first();

    if (existingRegistration) {
      const error = new Error('Already registered for this event') as CustomError;
      error.statusCode = 400;
      throw error;
    }

    // Check if event has space
    if (event.maxAttendees) {
      const currentAttendees = await EventAttendee.query()
        .where({ eventId, status: 'registered' })
        .resultSize();

      if (currentAttendees >= event.maxAttendees) {
        const error = new Error('Event is full') as CustomError;
        error.statusCode = 400;
        throw error;
      }
    }

    const registration = await EventAttendee.query().insert({
      eventId,
      userId,
      status: 'registered',
      registeredAt: new Date().toISOString(),
    });

    return await EventAttendee.query()
      .findById(registration.id)
      .withGraphFetched('[event, user]');
  }

  async unregisterFromEvent(eventId: string, userId: string) {
    const registration = await EventAttendee.query()
      .where({ eventId, userId })
      .first();

    if (!registration) {
      const error = new Error('Not registered for this event') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    // Check if event has already started
    const event = await Event.query().findById(eventId);
    if (event && new Date(event.startDate) < new Date()) {
      const error = new Error('Cannot unregister from events that have started') as CustomError;
      error.statusCode = 400;
      throw error;
    }

    await EventAttendee.query()
      .findById(registration.id)
      .patch({ status: 'cancelled' });
  }

  async getEventAttendees(eventId: string) {
    const event = await Event.query().findById(eventId);
    
    if (!event) {
      const error = new Error('Event not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    const attendees = await EventAttendee.query()
      .where({ eventId, status: 'registered' })
      .withGraphFetched('[user]')
      .orderBy('registeredAt', 'asc');

    return attendees;
  }

  async getUserEvents(userId: string, status?: 'upcoming' | 'past' | 'all') {
    let attendeeQuery = EventAttendee.query()
      .where({ userId, status: 'registered' })
      .withGraphFetched('[event]');

    const registrations = await attendeeQuery;

    // Filter events based on status
    let filteredRegistrations = registrations;
    if (status && status !== 'all') {
      const now = new Date().toISOString();
      filteredRegistrations = registrations.filter(reg => {
        if (!reg.event) return false;
        if (status === 'upcoming') {
          return reg.event.startDate > now;
        } else {
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

  async getUpcomingEvents(limit: number = 10) {
    const events = await Event.query()
      .modify('active')
      .modify('upcoming')
      .modify('ordered', 'asc')
      .limit(limit)
      .withGraphFetched('[creator]');

    return events;
  }

  async getPastEvents(limit: number = 10) {
    const events = await Event.query()
      .modify('active')
      .modify('past')
      .modify('ordered', 'desc')
      .limit(limit)
      .withGraphFetched('[creator]');

    return events;
  }
}

export default new EventService();
