import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/middleware/auth';
export declare const getAllTickets: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getTicketById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const createTicket: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateTicket: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteTicket: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getCategories: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getUserTickets: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAssignedTickets: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getUnassignedTickets: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const assignTicket: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const respondToTicket: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getTicketStats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const searchTickets: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=supportController.d.ts.map