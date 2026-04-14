import { Request, Response, NextFunction } from 'express';
import faqService from '@/services/faqService';
import { AuthenticatedRequest } from '@/middleware/auth';

export const getAllFAQs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search, page = '1', limit = '50' } = req.query;
    
    const result = await faqService.getAllFAQs({
      category: category as string,
      search: search as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: result,
      message: 'FAQs retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getFAQById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const faq = await faqService.getFAQById(id);

    res.json({
      success: true,
      data: faq,
      message: 'FAQ retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const createFAQ = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { question, answer, category, order } = req.body;
    const userId = req.user!.id;

    const faq = await faqService.createFAQ({
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
  } catch (error) {
    next(error);
  }
};

export const updateFAQ = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { question, answer, category, order, isActive } = req.body;
    const userId = req.user!.id;

    const faq = await faqService.updateFAQ(id, {
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
  } catch (error) {
    next(error);
  }
};

export const deleteFAQ = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await faqService.deleteFAQ(id);

    res.json({
      success: true,
      message: 'FAQ deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await faqService.getCategories();

    res.json({
      success: true,
      data: categories,
      message: 'Categories retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const searchFAQs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q: searchTerm, limit = '10' } = req.query;
    
    if (!searchTerm) {
      res.status(400).json({
        success: false,
        message: 'Search term is required',
      });
      return;
    }

    const faqs = await faqService.searchFAQs(
      searchTerm as string,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: faqs,
      message: 'FAQs searched successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getPopularFAQs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = '10' } = req.query;
    
    const faqs = await faqService.getPopularFAQs(
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: faqs,
      message: 'Popular FAQs retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const reorderFAQs = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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

    const faqs = await faqService.reorderFAQs(category, faqIds);

    res.json({
      success: true,
      data: faqs,
      message: 'FAQs reordered successfully',
    });
  } catch (error) {
    next(error);
  }
};
