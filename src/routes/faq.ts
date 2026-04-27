import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  getAllFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getCategories,
  searchFAQs,
  getPopularFAQs,
  reorderFAQs,
} from '../controllers/faqController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Validation middleware
const createFAQValidation = [
  body('question')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Question must be between 10 and 500 characters'),
  body('answer')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Answer must be at least 10 characters long'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category must be between 2 and 100 characters'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
];

const updateFAQValidation = [
  body('question')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Question must be between 10 and 500 characters'),
  body('answer')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Answer must be at least 10 characters long'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category must be between 2 and 100 characters'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
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

const reorderValidation = [
  body('faqIds')
    .isArray({ min: 1 })
    .withMessage('FAQ IDs array is required and must not be empty'),
  body('faqIds.*')
    .isUUID()
    .withMessage('Each FAQ ID must be a valid UUID'),
];

// Public routes
router.get('/', getAllFAQs);
router.get('/search', searchValidation, validate, searchFAQs);
router.get('/popular', getPopularFAQs);
router.get('/categories', getCategories);
router.get('/:id', getFAQById);

// Protected routes (require authentication)
router.post('/', authenticate, createFAQValidation, validate, createFAQ);
router.put('/:id', authenticate, updateFAQValidation, validate, updateFAQ);
router.delete('/:id', authenticate, deleteFAQ);

// Admin routes (require admin role)
router.put('/:category/reorder', authenticate, authorize(['admin', 'core_team']), reorderValidation, validate, reorderFAQs);

export default router;
