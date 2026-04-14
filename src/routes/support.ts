import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  getCategories,
  getUserTickets,
  getAssignedTickets,
  getUnassignedTickets,
  assignTicket,
  respondToTicket,
  getTicketStats,
  searchTickets,
} from '@/controllers/supportController';
import { authenticate, authorize } from '@/middleware/auth';
import { validate } from '@/middleware/validation';

const router = Router();

// Validation middleware
const createTicketValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category must be between 2 and 100 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
];

const updateTicketValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
  body('status')
    .optional()
    .isIn(['open', 'in_progress', 'resolved', 'closed'])
    .withMessage('Status must be open, in_progress, resolved, or closed'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category must be between 2 and 100 characters'),
  body('assignedTo')
    .optional()
    .isUUID()
    .withMessage('Assigned user ID must be a valid UUID'),
  body('response')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Response must be at least 10 characters long'),
];

const assignTicketValidation = [
  body('assignedTo')
    .isUUID()
    .withMessage('Assigned user ID must be a valid UUID'),
];

const respondTicketValidation = [
  body('response')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Response must be at least 10 characters long'),
];

const ticketQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['open', 'in_progress', 'resolved', 'closed'])
    .withMessage('Status must be open, in_progress, resolved, or closed'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
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

// Public routes
router.get('/categories', getCategories);

// Protected routes (require authentication)
router.get('/my-tickets', authenticate, getUserTickets);
router.get('/assigned-tickets', authenticate, getAssignedTickets);
router.get('/unassigned-tickets', authenticate, authorize(['admin', 'core_team']), getUnassignedTickets);
router.get('/stats', authenticate, authorize(['admin', 'core_team']), getTicketStats);
router.get('/search', searchValidation, validate, searchTickets);

// Ticket CRUD operations
router.post('/', authenticate, createTicketValidation, validate, createTicket);
router.get('/', ticketQueryValidation, validate, getAllTickets);
router.get('/:id', authenticate, getTicketById);
router.put('/:id', authenticate, updateTicketValidation, validate, updateTicket);
router.delete('/:id', authenticate, authorize(['admin', 'core_team']), deleteTicket);

// Ticket management
router.put('/:id/assign', authenticate, authorize(['admin', 'core_team']), assignTicketValidation, validate, assignTicket);
router.put('/:id/respond', authenticate, respondTicketValidation, validate, respondToTicket);

export default router;
