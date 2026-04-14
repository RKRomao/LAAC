"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const locationController_1 = require("@/controllers/locationController");
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/middleware/validation");
const router = (0, express_1.Router)();
const createLocationValidation = [
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Name must be between 2 and 200 characters'),
    (0, express_validator_1.body)('description')
        .trim()
        .isLength({ min: 10 })
        .withMessage('Description must be at least 10 characters long'),
    (0, express_validator_1.body)('address')
        .trim()
        .isLength({ min: 5, max: 255 })
        .withMessage('Address must be between 5 and 255 characters'),
    (0, express_validator_1.body)('coordinates')
        .isObject()
        .withMessage('Coordinates must be an object'),
    (0, express_validator_1.body)('coordinates.lat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),
    (0, express_validator_1.body)('coordinates.lng')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180'),
    (0, express_validator_1.body)('category')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Category must be between 2 and 100 characters'),
    (0, express_validator_1.body)('imageUrl')
        .optional()
        .isURL()
        .withMessage('Image URL must be a valid URL'),
    (0, express_validator_1.body)('website')
        .optional()
        .isURL()
        .withMessage('Website must be a valid URL'),
    (0, express_validator_1.body)('phone')
        .optional()
        .isLength({ max: 20 })
        .withMessage('Phone number must be at most 20 characters'),
    (0, express_validator_1.body)('email')
        .optional()
        .isEmail()
        .withMessage('Email must be a valid email address'),
    (0, express_validator_1.body)('openingHours')
        .optional()
        .isLength({ max: 255 })
        .withMessage('Opening hours must be at most 255 characters'),
];
const updateLocationValidation = [
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Name must be between 2 and 200 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ min: 10 })
        .withMessage('Description must be at least 10 characters long'),
    (0, express_validator_1.body)('address')
        .optional()
        .trim()
        .isLength({ min: 5, max: 255 })
        .withMessage('Address must be between 5 and 255 characters'),
    (0, express_validator_1.body)('coordinates')
        .optional()
        .isObject()
        .withMessage('Coordinates must be an object'),
    (0, express_validator_1.body)('coordinates.lat')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),
    (0, express_validator_1.body)('coordinates.lng')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180'),
    (0, express_validator_1.body)('category')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Category must be between 2 and 100 characters'),
    (0, express_validator_1.body)('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),
    (0, express_validator_1.body)('imageUrl')
        .optional()
        .isURL()
        .withMessage('Image URL must be a valid URL'),
    (0, express_validator_1.body)('website')
        .optional()
        .isURL()
        .withMessage('Website must be a valid URL'),
    (0, express_validator_1.body)('phone')
        .optional()
        .isLength({ max: 20 })
        .withMessage('Phone number must be at most 20 characters'),
    (0, express_validator_1.body)('email')
        .optional()
        .isEmail()
        .withMessage('Email must be a valid email address'),
    (0, express_validator_1.body)('openingHours')
        .optional()
        .isLength({ max: 255 })
        .withMessage('Opening hours must be at most 255 characters'),
];
const locationQueryValidation = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('lat')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),
    (0, express_validator_1.query)('lng')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180'),
    (0, express_validator_1.query)('radius')
        .optional()
        .isFloat({ min: 0.1, max: 100 })
        .withMessage('Radius must be between 0.1 and 100 km'),
];
const nearbyValidation = [
    (0, express_validator_1.query)('lat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),
    (0, express_validator_1.query)('lng')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180'),
    (0, express_validator_1.query)('radius')
        .optional()
        .isFloat({ min: 0.1, max: 100 })
        .withMessage('Radius must be between 0.1 and 100 km'),
];
const boundsValidation = [
    (0, express_validator_1.query)('minLat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Minimum latitude must be between -90 and 90'),
    (0, express_validator_1.query)('minLng')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Minimum longitude must be between -180 and 180'),
    (0, express_validator_1.query)('maxLat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Maximum latitude must be between -90 and 90'),
    (0, express_validator_1.query)('maxLng')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Maximum longitude must be between -180 and 180'),
];
const searchValidation = [
    (0, express_validator_1.query)('q')
        .notEmpty()
        .withMessage('Search query is required')
        .isLength({ min: 2 })
        .withMessage('Search query must be at least 2 characters long'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
];
const distanceValidation = [
    (0, express_validator_1.query)('lat1')
        .isFloat({ min: -90, max: 90 })
        .withMessage('First latitude must be between -90 and 90'),
    (0, express_validator_1.query)('lng1')
        .isFloat({ min: -180, max: 180 })
        .withMessage('First longitude must be between -180 and 180'),
    (0, express_validator_1.query)('lat2')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Second latitude must be between -90 and 90'),
    (0, express_validator_1.query)('lng2')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Second longitude must be between -180 and 180'),
];
router.get('/categories', locationController_1.getCategories);
router.get('/nearby', nearbyValidation, validation_1.validate, locationController_1.findNearby);
router.get('/within-bounds', boundsValidation, validation_1.validate, locationController_1.findWithinBounds);
router.get('/search', searchValidation, validation_1.validate, locationController_1.searchLocations);
router.get('/distance', distanceValidation, validation_1.validate, locationController_1.calculateDistance);
router.get('/', locationQueryValidation, validation_1.validate, locationController_1.getAllLocations);
router.get('/:id', locationController_1.getLocationById);
router.post('/', auth_1.authenticate, createLocationValidation, validation_1.validate, locationController_1.createLocation);
router.put('/:id', auth_1.authenticate, updateLocationValidation, validation_1.validate, locationController_1.updateLocation);
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)(['admin', 'core_team']), locationController_1.deleteLocation);
exports.default = router;
//# sourceMappingURL=locations.js.map