import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  getCategories,
  findNearby,
  findWithinBounds,
  searchLocations,
  calculateDistance,
} from '../controllers/locationController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Validation middleware
const createLocationValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Name must be between 2 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
  body('address')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Address must be between 5 and 255 characters'),
  body('coordinates')
    .isObject()
    .withMessage('Coordinates must be an object'),
  body('coordinates.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('coordinates.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category must be between 2 and 100 characters'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL'),
  body('phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Phone number must be at most 20 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email must be a valid email address'),
  body('openingHours')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Opening hours must be at most 255 characters'),
];

const updateLocationValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Name must be between 2 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
  body('address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Address must be between 5 and 255 characters'),
  body('coordinates')
    .optional()
    .isObject()
    .withMessage('Coordinates must be an object'),
  body('coordinates.lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('coordinates.lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category must be between 2 and 100 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL'),
  body('phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Phone number must be at most 20 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email must be a valid email address'),
  body('openingHours')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Opening hours must be at most 255 characters'),
];

const locationQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  query('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 100 })
    .withMessage('Radius must be between 0.1 and 100 km'),
];

const nearbyValidation = [
  query('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  query('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 100 })
    .withMessage('Radius must be between 0.1 and 100 km'),
];

const boundsValidation = [
  query('minLat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Minimum latitude must be between -90 and 90'),
  query('minLng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Minimum longitude must be between -180 and 180'),
  query('maxLat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Maximum latitude must be between -90 and 90'),
  query('maxLng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Maximum longitude must be between -180 and 180'),
];

const searchValidation = [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters long'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

const distanceValidation = [
  query('lat1')
    .isFloat({ min: -90, max: 90 })
    .withMessage('First latitude must be between -90 and 90'),
  query('lng1')
    .isFloat({ min: -180, max: 180 })
    .withMessage('First longitude must be between -180 and 180'),
  query('lat2')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Second latitude must be between -90 and 90'),
  query('lng2')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Second longitude must be between -180 and 180'),
];

// Public routes
router.get('/categories', getCategories);
router.get('/nearby', nearbyValidation, validate, findNearby);
router.get('/within-bounds', boundsValidation, validate, findWithinBounds);
router.get('/search', searchValidation, validate, searchLocations);
router.get('/distance', distanceValidation, validate, calculateDistance);

// Location CRUD operations
router.get('/', locationQueryValidation, validate, getAllLocations);
router.get('/:id', getLocationById);

// Protected routes (require authentication)
router.post('/', authenticate, createLocationValidation, validate, createLocation);
router.put('/:id', authenticate, updateLocationValidation, validate, updateLocation);
router.delete('/:id', authenticate, authorize(['admin', 'core_team']), deleteLocation);

export default router;
