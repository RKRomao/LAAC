"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Location_1 = __importDefault(require("../models/Location"));
class LocationService {
    async getAllLocations(query = {}) {
        const { category, search, lat, lng, radius = 5, minLat, minLng, maxLat, maxLng, page = 1, limit = 50, } = query;
        let locationQuery = Location_1.default.query()
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
        if (lat && lng) {
            locationQuery = locationQuery.modify('nearPoint', lat, lng, radius);
        }
        else if (minLat && minLng && maxLat && maxLng) {
            locationQuery = locationQuery.modify('withinBoundingBox', minLat, minLng, maxLat, maxLng);
        }
        const total = await locationQuery.clone().resultSize();
        const offset = (page - 1) * limit;
        const locations = await locationQuery.limit(limit).offset(offset);
        if (lat && lng) {
            const locationsWithDistance = await Promise.all(locations.map(async (location) => {
                const distance = await Location_1.default.calculateDistance(lat, lng, location.latitude || 0, location.longitude || 0);
                return { ...location, distance };
            }));
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
    async getLocationById(id) {
        const location = await Location_1.default.query()
            .findById(id)
            .withGraphFetched('[creator, updater]')
            .modify('active');
        if (!location) {
            const error = new Error('Location not found');
            error.statusCode = 404;
            throw error;
        }
        return location;
    }
    async createLocation(data, userId) {
        const { name, description, address, coordinates, category, imageUrl, website, phone, email, openingHours, } = data;
        if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
            const error = new Error('Valid coordinates are required');
            error.statusCode = 400;
            throw error;
        }
        if (coordinates.lat < -90 || coordinates.lat > 90 || coordinates.lng < -180 || coordinates.lng > 180) {
            const error = new Error('Coordinates must be within valid ranges');
            error.statusCode = 400;
            throw error;
        }
        const location = await Location_1.default.query().insert({
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
        return await Location_1.default.query()
            .findById(location.id)
            .withGraphFetched('[creator]');
    }
    async updateLocation(id, data, userId) {
        const location = await Location_1.default.query().findById(id);
        if (!location) {
            const error = new Error('Location not found');
            error.statusCode = 404;
            throw error;
        }
        if (data.coordinates) {
            if (typeof data.coordinates.lat !== 'number' || typeof data.coordinates.lng !== 'number') {
                const error = new Error('Valid coordinates are required');
                error.statusCode = 400;
                throw error;
            }
            if (data.coordinates.lat < -90 || data.coordinates.lat > 90 ||
                data.coordinates.lng < -180 || data.coordinates.lng > 180) {
                const error = new Error('Coordinates must be within valid ranges');
                error.statusCode = 400;
                throw error;
            }
            data.coordinates = `POINT(${data.coordinates.lng} ${data.coordinates.lat})`;
        }
        const updatedLocation = await Location_1.default.query().patchAndFetchById(id, {
            ...data,
            updatedBy: userId,
        });
        return await Location_1.default.query()
            .findById(updatedLocation.id)
            .withGraphFetched('[creator, updater]');
    }
    async deleteLocation(id) {
        const location = await Location_1.default.query().findById(id);
        if (!location) {
            const error = new Error('Location not found');
            error.statusCode = 404;
            throw error;
        }
        await Location_1.default.query().findById(id).patch({ isActive: false });
    }
    async getCategories() {
        return await Location_1.default.getCategories();
    }
    async findNearby(lat, lng, radiusKm = 5, category) {
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            const error = new Error('Valid coordinates are required');
            error.statusCode = 400;
            throw error;
        }
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            const error = new Error('Coordinates must be within valid ranges');
            error.statusCode = 400;
            throw error;
        }
        const locations = await Location_1.default.findNearby(lat, lng, radiusKm, category);
        const locationsWithDistance = await Promise.all(locations.map(async (location) => {
            const distance = await Location_1.default.calculateDistance(lat, lng, location.latitude || 0, location.longitude || 0);
            return { ...location, distance };
        }));
        return locationsWithDistance;
    }
    async findWithinBounds(minLat, minLng, maxLat, maxLng, category) {
        if (typeof minLat !== 'number' || typeof minLng !== 'number' ||
            typeof maxLat !== 'number' || typeof maxLng !== 'number') {
            const error = new Error('Valid coordinates are required');
            error.statusCode = 400;
            throw error;
        }
        if (minLat >= maxLat || minLng >= maxLng) {
            const error = new Error('Invalid bounding box');
            error.statusCode = 400;
            throw error;
        }
        return await Location_1.default.findWithinBounds(minLat, minLng, maxLat, maxLng, category);
    }
    async searchLocations(searchTerm, limit = 20, category) {
        let locationQuery = Location_1.default.query()
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
    async calculateDistance(lat1, lng1, lat2, lng2) {
        return await Location_1.default.calculateDistance(lat1, lng1, lat2, lng2);
    }
}
exports.default = new LocationService();
//# sourceMappingURL=locationService.js.map