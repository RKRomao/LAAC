import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/middleware/auth';
export declare const getAllEvents: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getEventById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const createEvent: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateEvent: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteEvent: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getCategories: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const registerForEvent: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const unregisterFromEvent: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getEventAttendees: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getUserEvents: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getUpcomingEvents: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getPastEvents: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=eventController.d.ts.map