import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const getAllLocations: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getLocationById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const createLocation: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateLocation: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteLocation: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getCategories: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const findNearby: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const findWithinBounds: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const searchLocations: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const calculateDistance: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=locationController.d.ts.map