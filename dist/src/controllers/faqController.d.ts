import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/middleware/auth';
export declare const getAllFAQs: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getFAQById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const createFAQ: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateFAQ: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteFAQ: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getCategories: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const searchFAQs: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getPopularFAQs: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const reorderFAQs: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=faqController.d.ts.map