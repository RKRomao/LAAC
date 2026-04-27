"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderFAQs = exports.getPopularFAQs = exports.searchFAQs = exports.getCategories = exports.deleteFAQ = exports.updateFAQ = exports.createFAQ = exports.getFAQById = exports.getAllFAQs = void 0;
const faqService_1 = __importDefault(require("../services/faqService"));
const getAllFAQs = async (req, res, next) => {
    try {
        const { category, search, page = '1', limit = '50' } = req.query;
        const result = await faqService_1.default.getAllFAQs({
            category: category,
            search: search,
            page: parseInt(page),
            limit: parseInt(limit),
        });
        res.json({
            success: true,
            data: result,
            message: 'FAQs retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllFAQs = getAllFAQs;
const getFAQById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const faq = await faqService_1.default.getFAQById(id);
        res.json({
            success: true,
            data: faq,
            message: 'FAQ retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getFAQById = getFAQById;
const createFAQ = async (req, res, next) => {
    try {
        const { question, answer, category, order } = req.body;
        const userId = req.user.id;
        const faq = await faqService_1.default.createFAQ({
            question,
            answer,
            category,
            order,
        }, userId);
        res.status(201).json({
            success: true,
            data: faq,
            message: 'FAQ created successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createFAQ = createFAQ;
const updateFAQ = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { question, answer, category, order, isActive } = req.body;
        const userId = req.user.id;
        const faq = await faqService_1.default.updateFAQ(id, {
            question,
            answer,
            category,
            order,
            isActive,
        }, userId);
        res.json({
            success: true,
            data: faq,
            message: 'FAQ updated successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateFAQ = updateFAQ;
const deleteFAQ = async (req, res, next) => {
    try {
        const { id } = req.params;
        await faqService_1.default.deleteFAQ(id);
        res.json({
            success: true,
            message: 'FAQ deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteFAQ = deleteFAQ;
const getCategories = async (req, res, next) => {
    try {
        const categories = await faqService_1.default.getCategories();
        res.json({
            success: true,
            data: categories,
            message: 'Categories retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCategories = getCategories;
const searchFAQs = async (req, res, next) => {
    try {
        const { q: searchTerm, limit = '10' } = req.query;
        if (!searchTerm) {
            res.status(400).json({
                success: false,
                message: 'Search term is required',
            });
            return;
        }
        const faqs = await faqService_1.default.searchFAQs(searchTerm, parseInt(limit));
        res.json({
            success: true,
            data: faqs,
            message: 'FAQs searched successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.searchFAQs = searchFAQs;
const getPopularFAQs = async (req, res, next) => {
    try {
        const { limit = '10' } = req.query;
        const faqs = await faqService_1.default.getPopularFAQs(parseInt(limit));
        res.json({
            success: true,
            data: faqs,
            message: 'Popular FAQs retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPopularFAQs = getPopularFAQs;
const reorderFAQs = async (req, res, next) => {
    try {
        const { category } = req.params;
        const { faqIds } = req.body;
        if (!Array.isArray(faqIds) || faqIds.length === 0) {
            res.status(400).json({
                success: false,
                message: 'FAQ IDs array is required',
            });
            return;
        }
        const faqs = await faqService_1.default.reorderFAQs(category, faqIds);
        res.json({
            success: true,
            data: faqs,
            message: 'FAQs reordered successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.reorderFAQs = reorderFAQs;
//# sourceMappingURL=faqController.js.map