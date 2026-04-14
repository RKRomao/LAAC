"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const eventController_1 = require("@/controllers/eventController");
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/middleware/validation");
const router = (0, express_1.Router)();
const createEventValidation = [
    (0, express_validator_1.body)('title')
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    (0, express_validator_1.body)('description')
        .trim()
        .isLength({ min: 10 })
        .withMessage('Description must be at least 10 characters long'),
    (0, express_validator_1.body)('location')
        .trim()
        .isLength({ min: 3, max: 255 })
        .withMessage('Location must be between 3 and 255 characters'),
    (0, express_validator_1.body)('startDate')
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    (0, express_validator_1.body)('endDate')
        .isISO8601()
        .withMessage('End date must be a valid date'),
    (0, express_validator_1.body)('category')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Category must be between 2 and 100 characters'),
    (0, express_validator_1.body)('maxAttendees')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Max attendees must be a positive integer'),
    (0, express_validator_1.body)('imageUrl')
        .optional()
        .isURL()
        .withMessage('Image URL must be a valid URL'),
];
const updateEventValidation = [
    (0, express_validator_1.body)('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ min: 10 })
        .withMessage('Description must be at least 10 characters long'),
    (0, express_validator_1.body)('location')
        .optional()
        .trim()
        .isLength({ min: 3, max: 255 })
        .withMessage('Location must be between 3 and 255 characters'),
    (0, express_validator_1.body)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    (0, express_validator_1.body)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date'),
    (0, express_validator_1.body)('category')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Category must be between 2 and 100 characters'),
    (0, express_validator_1.body)('maxAttendees')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Max attendees must be a positive integer'),
    (0, express_validator_1.body)('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),
    (0, express_validator_1.body)('imageUrl')
        .optional()
        .isURL()
        .withMessage('Image URL must be a valid URL'),
];
const eventQueryValidation = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['upcoming', 'past', 'ongoing'])
        .withMessage('Status must be upcoming, past, or ongoing'),
    (0, express_validator_1.query)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    (0, express_validator_1.query)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date'),
];
router.get('/', eventQueryValidation, validation_1.validate, eventController_1.getAllEvents);
router.get('/categories', eventController_1.getCategories);
router.get('/upcoming', eventController_1.getUpcomingEvents);
router.get('/past', eventController_1.getPastEvents);
router.get('/:id', eventController_1.getEventById);
router.get('/my-events', auth_1.authenticate, eventController_1.getUserEvents);
router.post('/:id/register', auth_1.authenticate, eventController_1.registerForEvent);
router.delete('/:id/unregister', auth_1.authenticate, eventController_1.unregisterFromEvent);
router.post('/', auth_1.authenticate, createEventValidation, validation_1.validate, eventController_1.createEvent);
router.put('/:id', auth_1.authenticate, updateEventValidation, validation_1.validate, eventController_1.updateEvent);
router.delete('/:id', auth_1.authenticate, eventController_1.deleteEvent);
router.get('/:id/attendees', auth_1.authenticate, (0, auth_1.authorize)(['admin', 'core_team']), eventController_1.getEventAttendees);
exports.default = router;
//# sourceMappingURL=events.js.map