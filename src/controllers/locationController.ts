import { Request, Response, NextFunction } from 'express';
import locationService from '@/services/locationService';
import { AuthenticatedRequest } from '@/middleware/auth';

export const getAllLocations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      category,
      search,
      lat,
      lng,
      radius,
      minLat,
      minLng,
      maxLat,
      maxLng,
      page = '1',
      limit = '50',
    } = req.query;
    
    const result = await locationService.getAllLocations({
      category: category as string,
      search: search as string,
      lat: lat ? parseFloat(lat as string) : undefined,
      lng: lng ? parseFloat(lng as string) : undefined,
      radius: radius ? parseFloat(radius as string) : undefined,
      minLat: minLat ? parseFloat(minLat as string) : undefined,
      minLng: minLng ? parseFloat(minLng as string) : undefined,
      maxLat: maxLat ? parseFloat(maxLat as string) : undefined,
      maxLng: maxLng ? parseFloat(maxLng as string) : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: result,
      message: 'Locations retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getLocationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const location = await locationService.getLocationById(id);

    res.json({
      success: true,
      data: location,
      message: 'Location retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const createLocation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, address, coordinates, category, imageUrl, website, phone, email, openingHours } = req.body;
    const userId = req.user!.id;

    const location = await locationService.createLocation({
      name,
      description,
      address,
      coordinates,
      category,
      imageUrl,
      website,
      phone,
      email,
      openingHours,
    }, userId);

    res.status(201).json({
      success: true,
      data: location,
      message: 'Location created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateLocation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, address, coordinates, category, imageUrl, website, phone, email, openingHours, isActive } = req.body;
    const userId = req.user!.id;

    const location = await locationService.updateLocation(id, {
      name,
      description,
      address,
      coordinates,
      category,
      imageUrl,
      website,
      phone,
      email,
      openingHours,
      isActive,
    }, userId);

    res.json({
      success: true,
      data: location,
      message: 'Location updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLocation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await locationService.deleteLocation(id);

    res.json({
      success: true,
      message: 'Location deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await locationService.getCategories();

    res.json({
      success: true,
      data: categories,
      message: 'Location categories retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const findNearby = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lat, lng, radius = '5', category } = req.query;
    
    if (!lat || !lng) {
      res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
      return;
    }

    const locations = await locationService.findNearby(
      parseFloat(lat as string),
      parseFloat(lng as string),
      parseFloat(radius as string),
      category as string
    );

    res.json({
      success: true,
      data: locations,
      message: 'Nearby locations retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const findWithinBounds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { minLat, minLng, maxLat, maxLng, category } = req.query;
    
    if (!minLat || !minLng || !maxLat || !maxLng) {
      res.status(400).json({
        success: false,
        message: 'All bounding box coordinates are required',
      });
      return;
    }

    const locations = await locationService.findWithinBounds(
      parseFloat(minLat as string),
      parseFloat(minLng as string),
      parseFloat(maxLat as string),
      parseFloat(maxLng as string),
      category as string
    );

    res.json({
      success: true,
      data: locations,
      message: 'Locations within bounds retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const searchLocations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q: searchTerm, limit = '20', category } = req.query;
    
    if (!searchTerm) {
      res.status(400).json({
        success: false,
        message: 'Search term is required',
      });
      return;
    }

    const locations = await locationService.searchLocations(
      searchTerm as string,
      parseInt(limit as string),
      category as string
    );

    res.json({
      success: true,
      data: locations,
      message: 'Locations searched successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const calculateDistance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lat1, lng1, lat2, lng2 } = req.query;
    
    if (!lat1 || !lng1 || !lat2 || !lng2) {
      res.status(400).json({
        success: false,
        message: 'All coordinates are required',
      });
      return;
    }

    const distance = await locationService.calculateDistance(
      parseFloat(lat1 as string),
      parseFloat(lng1 as string),
      parseFloat(lat2 as string),
      parseFloat(lng2 as string)
    );

    res.json({
      success: true,
      data: { distance, unit: 'km' },
      message: 'Distance calculated successfully',
    });
  } catch (error) {
    next(error);
  }
};
