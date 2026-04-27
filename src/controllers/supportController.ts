import { Request, Response, NextFunction } from 'express';
import supportService from '../services/supportService';
import { AuthenticatedRequest } from '../middleware/auth';

export const getAllTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, priority, category, assignedTo, userId, page = '1', limit = '50' } = req.query;
    
    const result = await supportService.getAllTickets({
      status: status as string,
      priority: priority as string,
      category: category as string,
      assignedTo: assignedTo as string,
      userId: userId as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: result,
      message: 'Support tickets retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getTicketById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const ticket = await supportService.getTicketById(id);

    res.json({
      success: true,
      data: ticket,
      message: 'Support ticket retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const createTicket = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, category, priority } = req.body;
    const userId = req.user!.id;

    const ticket = await supportService.createTicket({
      title,
      description,
      category,
      priority,
    }, userId);

    res.status(201).json({
      success: true,
      data: ticket,
      message: 'Support ticket created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateTicket = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, category, assignedTo, response } = req.body;
    const userId = req.user!.id;

    const ticket = await supportService.updateTicket(id, {
      title,
      description,
      status,
      priority,
      category,
      assignedTo,
      response,
    }, userId);

    res.json({
      success: true,
      data: ticket,
      message: 'Support ticket updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTicket = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await supportService.deleteTicket(id);

    res.json({
      success: true,
      message: 'Support ticket deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await supportService.getCategories();

    res.json({
      success: true,
      data: categories,
      message: 'Support ticket categories retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getUserTickets = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const userId = req.user!.id;

    const tickets = await supportService.getUserTickets(
      userId,
      status as string
    );

    res.json({
      success: true,
      data: tickets,
      message: 'User support tickets retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getAssignedTickets = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const assignedTo = req.user!.id;

    const tickets = await supportService.getAssignedTickets(
      assignedTo,
      status as string
    );

    res.json({
      success: true,
      data: tickets,
      message: 'Assigned support tickets retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getUnassignedTickets = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tickets = await supportService.getUnassignedTickets();

    res.json({
      success: true,
      data: tickets,
      message: 'Unassigned support tickets retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const assignTicket = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    const ticket = await supportService.assignTicket(id, assignedTo);

    res.json({
      success: true,
      data: ticket,
      message: 'Support ticket assigned successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const respondToTicket = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    const userId = req.user!.id;

    const ticket = await supportService.respondToTicket(id, response, userId);

    res.json({
      success: true,
      data: ticket,
      message: 'Response added to support ticket successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getTicketStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await supportService.getTicketStats();

    res.json({
      success: true,
      data: stats,
      message: 'Support ticket statistics retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const searchTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q: searchTerm, limit = '20' } = req.query;
    
    if (!searchTerm) {
      res.status(400).json({
        success: false,
        message: 'Search term is required',
      });
      return;
    }

    const tickets = await supportService.searchTickets(
      searchTerm as string,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: tickets,
      message: 'Support tickets searched successfully',
    });
  } catch (error) {
    next(error);
  }
};
