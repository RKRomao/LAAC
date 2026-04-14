"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPastEvents = exports.getUpcomingEvents = exports.getUserEvents = exports.getEventAttendees = exports.unregisterFromEvent = exports.registerForEvent = exports.getCategories = exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEventById = exports.getAllEvents = void 0;
const eventService_1 = __importDefault(require("@/services/eventService"));
const getAllEvents = async (req, res, next) => {
    try {
        const { category, startDate, endDate, status, page = '1', limit = '50' } = req.query;
        const result = await eventService_1.default.getAllEvents({
            category: category,
            startDate: startDate,
            endDate: endDate,
            status: status,
            page: parseInt(page),
            limit: parseInt(limit),
        });
        res.json({
            success: true,
            data: result,
            message: 'Events retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllEvents = getAllEvents;
const getEventById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const event = await eventService_1.default.getEventById(id);
        res.json({
            success: true,
            data: event,
            message: 'Event retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getEventById = getEventById;
const createEvent = async (req, res, next) => {
    try {
        const { title, description, location, startDate, endDate, imageUrl, category, maxAttendees } = req.body;
        const userId = req.user.id;
        const event = await eventService_1.default.createEvent({
            title,
            description,
            location,
            startDate,
            endDate,
            imageUrl,
            category,
            maxAttendees,
        }, userId);
        res.status(201).json({
            success: true,
            data: event,
            message: 'Event created successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createEvent = createEvent;
const updateEvent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, location, startDate, endDate, imageUrl, category, maxAttendees, isActive } = req.body;
        const userId = req.user.id;
        const event = await eventService_1.default.updateEvent(id, {
            title,
            description,
            location,
            startDate,
            endDate,
            imageUrl,
            category,
            maxAttendees,
            isActive,
        }, userId);
        res.json({
            success: true,
            data: event,
            message: 'Event updated successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateEvent = updateEvent;
const deleteEvent = async (req, res, next) => {
    try {
        const { id } = req.params;
        await eventService_1.default.deleteEvent(id);
        res.json({
            success: true,
            message: 'Event deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteEvent = deleteEvent;
const getCategories = async (req, res, next) => {
    try {
        const categories = await eventService_1.default.getCategories();
        res.json({
            success: true,
            data: categories,
            message: 'Event categories retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCategories = getCategories;
const registerForEvent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const registration = await eventService_1.default.registerForEvent(id, userId);
        res.status(201).json({
            success: true,
            data: registration,
            message: 'Successfully registered for event',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.registerForEvent = registerForEvent;
const unregisterFromEvent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await eventService_1.default.unregisterFromEvent(id, userId);
        res.json({
            success: true,
            message: 'Successfully unregistered from event',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.unregisterFromEvent = unregisterFromEvent;
const getEventAttendees = async (req, res, next) => {
    try {
        const { id } = req.params;
        const attendees = await eventService_1.default.getEventAttendees(id);
        res.json({
            success: true,
            data: attendees,
            message: 'Event attendees retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getEventAttendees = getEventAttendees;
const getUserEvents = async (req, res, next) => {
    try {
        const { status } = req.query;
        const userId = req.user.id;
        const events = await eventService_1.default.getUserEvents(userId, status);
        res.json({
            success: true,
            data: events,
            message: 'User events retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserEvents = getUserEvents;
const getUpcomingEvents = async (req, res, next) => {
    try {
        const { limit = '10' } = req.query;
        const events = await eventService_1.default.getUpcomingEvents(parseInt(limit));
        res.json({
            success: true,
            data: events,
            message: 'Upcoming events retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUpcomingEvents = getUpcomingEvents;
const getPastEvents = async (req, res, next) => {
    try {
        const { limit = '10' } = req.query;
        const events = await eventService_1.default.getPastEvents(parseInt(limit));
        res.json({
            success: true,
            data: events,
            message: 'Past events retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPastEvents = getPastEvents;
//# sourceMappingURL=eventController.js.map