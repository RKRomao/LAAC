import Location from '../models/Location';
import { CustomError } from '../middleware/errorHandler';

export interface CreateLocationData {
  name: string;
  description: string;
  address: string;
  coordinates: { lat: number; lng: number };
  category: string;
  imageUrl?: string;
  website?: string;
  phone?: string;
  email?: string;
  openingHours?: string;
}

export interface UpdateLocationData {
  name?: string;
  description?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  category?: string;
  imageUrl?: string;
  website?: string;
  phone?: string;
  email?: string;
  openingHours?: string;
  isActive?: boolean;
}

export interface LocationQuery {
  category?: string;
  search?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  minLat?: number;
  minLng?: number;
  maxLat?: number;
  maxLng?: number;
  page?: number;
  limit?: number;
}

class LocationService {
  async getAllLocations(query: LocationQuery = {}) {
    const {
      category,
      search,
      lat,
      lng,
      radius = 5,
      minLat,
      minLng,
      maxLat,
      maxLng,
      page = 1,
      limit = 50,
    } = query;

    let locationQuery = Location.query()
      .withGraphFetched('[creator, updater]')
      .modify('active');

    if (category) {
      locationQuery = locationQuery.modify('byCategory', category);
    }

    if (search) {
      locationQuery = locationQuery.where(builder => {
        builder
          .where('name', 'ilike', `%${search}%`)
          .orWhere('description', 'ilike', `%${search}%`)
          .orWhere('address', 'ilike', `%${search}%`)
          .orWhere('category', 'ilike', `%${search}%`);
      });
    }

    // Spatial queries
    if (lat && lng) {
      locationQuery = locationQuery.modify('nearPoint', lat, lng, radius);
    } else if (minLat && minLng && maxLat && maxLng) {
      locationQuery = locationQuery.modify('withinBoundingBox', minLat, minLng, maxLat, maxLng);
    }

    const total = await locationQuery.clone().resultSize();
    const offset = (page - 1) * limit;

    const locations = await locationQuery.limit(limit).offset(offset);

    // Add distance information if coordinates are provided
    if (lat && lng) {
      const locationsWithDistance = await Promise.all(
        locations.map(async (location) => {
          const distance = await Location.calculateDistance(
            lat, lng,
            location.latitude || 0,
            location.longitude || 0
          );
          return { ...location, distance };
        })
      );

      // Sort by distance
      locationsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));

      return {
        data: locationsWithDistance,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }

    return {
      data: locations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getLocationById(id: string) {
    const location = await Location.query()
      .findById(id)
      .withGraphFetched('[creator, updater]')
      .modify('active');

    if (!location) {
      const error = new Error('Location not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    return location;
  }

  async createLocation(data: CreateLocationData, userId: string) {
    const {
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
    } = data;

    // Validate coordinates
    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      const error = new Error('Valid coordinates are required') as CustomError;
      error.statusCode = 400;
      throw error;
    }

    // Validate coordinate ranges
    if (coordinates.lat < -90 || coordinates.lat > 90 || coordinates.lng < -180 || coordinates.lng > 180) {
      const error = new Error('Coordinates must be within valid ranges') as CustomError;
      error.statusCode = 400;
      throw error;
    }

    const location = await Location.query().insert({
      name,
      description,
      address,
      coordinates: `POINT(${coordinates.lng} ${coordinates.lat})`,
      category,
      imageUrl,
      website,
      phone,
      email,
      openingHours,
      createdBy: userId,
    });

    return await Location.query()
      .findById(location.id)
      .withGraphFetched('[creator]');
  }

  async updateLocation(id: string, data: UpdateLocationData, userId: string) {
    const location = await Location.query().findById(id);
    
    if (!location) {
      const error = new Error('Location not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    // Validate coordinates if provided
    if (data.coordinates) {
      if (typeof data.coordinates.lat !== 'number' || typeof data.coordinates.lng !== 'number') {
        const error = new Error('Valid coordinates are required') as CustomError;
        error.statusCode = 400;
        throw error;
      }

      if (data.coordinates.lat < -90 || data.coordinates.lat > 90 || 
          data.coordinates.lng < -180 || data.coordinates.lng > 180) {
        const error = new Error('Coordinates must be within valid ranges') as CustomError;
        error.statusCode = 400;
        throw error;
      }

      // Convert coordinates to PostGIS format
      (data as any).coordinates = `POINT(${data.coordinates.lng} ${data.coordinates.lat})`;
    }

    const updatedLocation = await Location.query().patchAndFetchById(id, {
      ...data,
      updatedBy: userId,
    });

    return await Location.query()
      .findById(updatedLocation.id)
      .withGraphFetched('[creator, updater]');
  }

  async deleteLocation(id: string) {
    const location = await Location.query().findById(id);
    
    if (!location) {
      const error = new Error('Location not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    // Soft delete - set isActive to false
    await Location.query().findById(id).patch({ isActive: false });
  }

  async getCategories() {
    return await Location.getCategories();
  }

  async findNearby(lat: number, lng: number, radiusKm: number = 5, category?: string) {
    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      const error = new Error('Valid coordinates are required') as CustomError;
      error.statusCode = 400;
      throw error;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      const error = new Error('Coordinates must be within valid ranges') as CustomError;
      error.statusCode = 400;
      throw error;
    }

    const locations = await Location.findNearby(lat, lng, radiusKm, category);

    // Add distance information
    const locationsWithDistance = await Promise.all(
      locations.map(async (location) => {
        const distance = await Location.calculateDistance(
          lat, lng,
          location.latitude || 0,
          location.longitude || 0
        );
        return { ...location, distance };
      })
    );

    return locationsWithDistance;
  }

  async findWithinBounds(minLat: number, minLng: number, maxLat: number, maxLng: number, category?: string) {
    // Validate coordinates
    if (typeof minLat !== 'number' || typeof minLng !== 'number' || 
        typeof maxLat !== 'number' || typeof maxLng !== 'number') {
      const error = new Error('Valid coordinates are required') as CustomError;
      error.statusCode = 400;
      throw error;
    }

    if (minLat >= maxLat || minLng >= maxLng) {
      const error = new Error('Invalid bounding box') as CustomError;
      error.statusCode = 400;
      throw error;
    }

    return await Location.findWithinBounds(minLat, minLng, maxLat, maxLng, category);
  }

  async searchLocations(searchTerm: string, limit: number = 20, category?: string) {
    let locationQuery = Location.query()
      .where(builder => {
        builder
          .where('name', 'ilike', `%${searchTerm}%`)
          .orWhere('description', 'ilike', `%${searchTerm}%`)
          .orWhere('address', 'ilike', `%${searchTerm}%`);
      })
      .modify('active')
      .withGraphFetched('[creator]');

    if (category) {
      locationQuery = locationQuery.modify('byCategory', category);
    }

    return await locationQuery;
  }

  async calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): Promise<number> {
    return await Location.calculateDistance(lat1, lng1, lat2, lng2);
  }
}

export default new LocationService();
