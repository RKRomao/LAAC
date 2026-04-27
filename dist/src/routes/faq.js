"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const faqController_1 = require("../controllers/faqController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
const createFAQValidation = [
    (0, express_validator_1.body)('question')
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('Question must be between 10 and 500 characters'),
    (0, express_validator_1.body)('answer')
        .trim()
        .isLength({ min: 10 })
        .withMessage('Answer must be at least 10 characters long'),
    (0, express_validator_1.body)('category')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Category must be between 2 and 100 characters'),
    (0, express_validator_1.body)('order')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Order must be a non-negative integer'),
];
const updateFAQValidation = [
    (0, express_validator_1.body)('question')
        .optional()
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('Question must be between 10 and 500 characters'),
    (0, express_validator_1.body)('answer')
        .optional()
        .trim()
        .isLength({ min: 10 })
        .withMessage('Answer must be at least 10 characters long'),
    (0, express_validator_1.body)('category')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Category must be between 2 and 100 characters'),
    (0, express_validator_1.body)('order')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Order must be a non-negative integer'),
    (0, express_validator_1.body)('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),
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
const reorderValidation = [
    (0, express_validator_1.body)('faqIds')
        .isArray({ min: 1 })
        .withMessage('FAQ IDs array is required and must not be empty'),
    (0, express_validator_1.body)('faqIds.*')
        .isUUID()
        .withMessage('Each FAQ ID must be a valid UUID'),
];
router.get('/', faqController_1.getAllFAQs);
router.get('/search', searchValidation, validation_1.validate, faqController_1.searchFAQs);
router.get('/popular', faqController_1.getPopularFAQs);
router.get('/categories', faqController_1.getCategories);
router.get('/:id', faqController_1.getFAQById);
router.post('/', auth_1.authenticate, createFAQValidation, validation_1.validate, faqController_1.createFAQ);
router.put('/:id', auth_1.authenticate, updateFAQValidation, validation_1.validate, faqController_1.updateFAQ);
router.delete('/:id', auth_1.authenticate, faqController_1.deleteFAQ);
router.put('/:category/reorder', auth_1.authenticate, (0, auth_1.authorize)(['admin', 'core_team']), reorderValidation, validation_1.validate, faqController_1.reorderFAQs);
exports.default = router;
//# sourceMappingURL=faq.js.map