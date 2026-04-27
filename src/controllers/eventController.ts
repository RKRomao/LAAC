import { Request, Response, NextFunction } from 'express';
import eventService from '../services/eventService';
import { AuthenticatedRequest } from '../middleware/auth';

export const getAllEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, startDate, endDate, status, page = '1', limit = '50' } = req.query;
    
    const result = await eventService.getAllEvents({
      category: category as string,
      startDate: startDate as string,
      endDate: endDate as string,
      status: status as 'upcoming' | 'past' | 'ongoing',
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: result,
      message: 'Events retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const event = await eventService.getEventById(id);

    res.json({
      success: true,
      data: event,
      message: 'Event retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, location, startDate, endDate, imageUrl, category, maxAttendees } = req.body;
    const userId = req.user!.id;

    const event = await eventService.createEvent({
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
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, location, startDate, endDate, imageUrl, category, maxAttendees, isActive } = req.body;
    const userId = req.user!.id;

    const event = await eventService.updateEvent(id, {
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
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await eventService.deleteEvent(id);

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await eventService.getCategories();

    res.json({
      success: true,
      data: categories,
      message: 'Event categories retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const registerForEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const registration = await eventService.registerForEvent(id, userId);

    res.status(201).json({
      success: true,
      data: registration,
      message: 'Successfully registered for event',
    });
  } catch (error) {
    next(error);
  }
};

export const unregisterFromEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    await eventService.unregisterFromEvent(id, userId);

    res.json({
      success: true,
      message: 'Successfully unregistered from event',
    });
  } catch (error) {
    next(error);
  }
};

export const getEventAttendees = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const attendees = await eventService.getEventAttendees(id);

    res.json({
      success: true,
      data: attendees,
      message: 'Event attendees retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getUserEvents = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const userId = req.user!.id;

    const events = await eventService.getUserEvents(
      userId,
      status as 'upcoming' | 'past' | 'all'
    );

    res.json({
      success: true,
      data: events,
      message: 'User events retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getUpcomingEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = '10' } = req.query;
    
    const events = await eventService.getUpcomingEvents(
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: events,
      message: 'Upcoming events retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getPastEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = '10' } = req.query;
    
    const events = await eventService.getPastEvents(
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: events,
      message: 'Past events retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};
