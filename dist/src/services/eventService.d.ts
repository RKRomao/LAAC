import Event from '../models/Event';
import EventAttendee from '../models/EventAttendee';
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
declare class EventService {
    getAllEvents(query?: EventQuery): Promise<{
        data: Event[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getEventById(id: string): Promise<Event>;
    createEvent(data: CreateEventData, userId: string): Promise<Event | undefined>;
    updateEvent(id: string, data: UpdateEventData, userId: string): Promise<Event | undefined>;
    deleteEvent(id: string): Promise<void>;
    getCategories(): Promise<string[]>;
    registerForEvent(eventId: string, userId: string): Promise<EventAttendee | undefined>;
    unregisterFromEvent(eventId: string, userId: string): Promise<void>;
    getEventAttendees(eventId: string): Promise<EventAttendee[]>;
    getUserEvents(userId: string, status?: 'upcoming' | 'past' | 'all'): Promise<any[]>;
    getUpcomingEvents(limit?: number): Promise<Event[]>;
    getPastEvents(limit?: number): Promise<Event[]>;
}
declare const _default: EventService;
export default _default;
//# sourceMappingURL=eventService.d.ts.map