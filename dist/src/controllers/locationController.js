"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistance = exports.searchLocations = exports.findWithinBounds = exports.findNearby = exports.getCategories = exports.deleteLocation = exports.updateLocation = exports.createLocation = exports.getLocationById = exports.getAllLocations = void 0;
const locationService_1 = __importDefault(require("@/services/locationService"));
const getAllLocations = async (req, res, next) => {
    try {
        const { category, search, lat, lng, radius, minLat, minLng, maxLat, maxLng, page = '1', limit = '50', } = req.query;
        const result = await locationService_1.default.getAllLocations({
            category: category,
            search: search,
            lat: lat ? parseFloat(lat) : undefined,
            lng: lng ? parseFloat(lng) : undefined,
            radius: radius ? parseFloat(radius) : undefined,
            minLat: minLat ? parseFloat(minLat) : undefined,
            minLng: minLng ? parseFloat(minLng) : undefined,
            maxLat: maxLat ? parseFloat(maxLat) : undefined,
            maxLng: maxLng ? parseFloat(maxLng) : undefined,
            page: parseInt(page),
            limit: parseInt(limit),
        });
        res.json({
            success: true,
            data: result,
            message: 'Locations retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllLocations = getAllLocations;
const getLocationById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const location = await locationService_1.default.getLocationById(id);
        res.json({
            success: true,
            data: location,
            message: 'Location retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getLocationById = getLocationById;
const createLocation = async (req, res, next) => {
    try {
        const { name, description, address, coordinates, category, imageUrl, website, phone, email, openingHours } = req.body;
        const userId = req.user.id;
        const location = await locationService_1.default.createLocation({
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
    }
    catch (error) {
        next(error);
    }
};
exports.createLocation = createLocation;
const updateLocation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, address, coordinates, category, imageUrl, website, phone, email, openingHours, isActive } = req.body;
        const userId = req.user.id;
        const location = await locationService_1.default.updateLocation(id, {
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
    }
    catch (error) {
        next(error);
    }
};
exports.updateLocation = updateLocation;
const deleteLocation = async (req, res, next) => {
    try {
        const { id } = req.params;
        await locationService_1.default.deleteLocation(id);
        res.json({
            success: true,
            message: 'Location deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteLocation = deleteLocation;
const getCategories = async (req, res, next) => {
    try {
        const categories = await locationService_1.default.getCategories();
        res.json({
            success: true,
            data: categories,
            message: 'Location categories retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCategories = getCategories;
const findNearby = async (req, res, next) => {
    try {
        const { lat, lng, radius = '5', category } = req.query;
        if (!lat || !lng) {
            res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required',
            });
            return;
        }
        const locations = await locationService_1.default.findNearby(parseFloat(lat), parseFloat(lng), parseFloat(radius), category);
        res.json({
            success: true,
            data: locations,
            message: 'Nearby locations retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.findNearby = findNearby;
const findWithinBounds = async (req, res, next) => {
    try {
        const { minLat, minLng, maxLat, maxLng, category } = req.query;
        if (!minLat || !minLng || !maxLat || !maxLng) {
            res.status(400).json({
                success: false,
                message: 'All bounding box coordinates are required',
            });
            return;
        }
        const locations = await locationService_1.default.findWithinBounds(parseFloat(minLat), parseFloat(minLng), parseFloat(maxLat), parseFloat(maxLng), category);
        res.json({
            success: true,
            data: locations,
            message: 'Locations within bounds retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.findWithinBounds = findWithinBounds;
const searchLocations = async (req, res, next) => {
    try {
        const { q: searchTerm, limit = '20', category } = req.query;
        if (!searchTerm) {
            res.status(400).json({
                success: false,
                message: 'Search term is required',
            });
            return;
        }
        const locations = await locationService_1.default.searchLocations(searchTerm, parseInt(limit), category);
        res.json({
            success: true,
            data: locations,
            message: 'Locations searched successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.searchLocations = searchLocations;
const calculateDistance = async (req, res, next) => {
    try {
        const { lat1, lng1, lat2, lng2 } = req.query;
        if (!lat1 || !lng1 || !lat2 || !lng2) {
            res.status(400).json({
                success: false,
                message: 'All coordinates are required',
            });
            return;
        }
        const distance = await locationService_1.default.calculateDistance(parseFloat(lat1), parseFloat(lng1), parseFloat(lat2), parseFloat(lng2));
        res.json({
            success: true,
            data: { distance, unit: 'km' },
            message: 'Distance calculated successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.calculateDistance = calculateDistance;
//# sourceMappingURL=locationController.js.map