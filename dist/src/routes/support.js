"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const supportController_1 = require("../controllers/supportController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
const createTicketValidation = [
    (0, express_validator_1.body)('title')
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    (0, express_validator_1.body)('description')
        .trim()
        .isLength({ min: 10 })
        .withMessage('Description must be at least 10 characters long'),
    (0, express_validator_1.body)('category')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Category must be between 2 and 100 characters'),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Priority must be low, medium, high, or urgent'),
];
const updateTicketValidation = [
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
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['open', 'in_progress', 'resolved', 'closed'])
        .withMessage('Status must be open, in_progress, resolved, or closed'),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Priority must be low, medium, high, or urgent'),
    (0, express_validator_1.body)('category')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Category must be between 2 and 100 characters'),
    (0, express_validator_1.body)('assignedTo')
        .optional()
        .isUUID()
        .withMessage('Assigned user ID must be a valid UUID'),
    (0, express_validator_1.body)('response')
        .optional()
        .trim()
        .isLength({ min: 10 })
        .withMessage('Response must be at least 10 characters long'),
];
const assignTicketValidation = [
    (0, express_validator_1.body)('assignedTo')
        .isUUID()
        .withMessage('Assigned user ID must be a valid UUID'),
];
const respondTicketValidation = [
    (0, express_validator_1.body)('response')
        .trim()
        .isLength({ min: 10 })
        .withMessage('Response must be at least 10 characters long'),
];
const ticketQueryValidation = [
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
        .isIn(['open', 'in_progress', 'resolved', 'closed'])
        .withMessage('Status must be open, in_progress, resolved, or closed'),
    (0, express_validator_1.query)('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Priority must be low, medium, high, or urgent'),
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
router.get('/categories', supportController_1.getCategories);
router.get('/my-tickets', auth_1.authenticate, supportController_1.getUserTickets);
router.get('/assigned-tickets', auth_1.authenticate, supportController_1.getAssignedTickets);
router.get('/unassigned-tickets', auth_1.authenticate, (0, auth_1.authorize)(['admin', 'core_team']), supportController_1.getUnassignedTickets);
router.get('/stats', auth_1.authenticate, (0, auth_1.authorize)(['admin', 'core_team']), supportController_1.getTicketStats);
router.get('/search', searchValidation, validation_1.validate, supportController_1.searchTickets);
router.post('/', auth_1.authenticate, createTicketValidation, validation_1.validate, supportController_1.createTicket);
router.get('/', ticketQueryValidation, validation_1.validate, supportController_1.getAllTickets);
router.get('/:id', auth_1.authenticate, supportController_1.getTicketById);
router.put('/:id', auth_1.authenticate, updateTicketValidation, validation_1.validate, supportController_1.updateTicket);
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)(['admin', 'core_team']), supportController_1.deleteTicket);
router.put('/:id/assign', auth_1.authenticate, (0, auth_1.authorize)(['admin', 'core_team']), assignTicketValidation, validation_1.validate, supportController_1.assignTicket);
router.put('/:id/respond', auth_1.authenticate, respondTicketValidation, validation_1.validate, supportController_1.respondToTicket);
exports.default = router;
//# sourceMappingURL=support.js.map