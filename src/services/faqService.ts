import FAQ from '@/models/FAQ';
import { CustomError } from '@/middleware/errorHandler';

export interface CreateFAQData {
  question: string;
  answer: string;
  category: string;
  order?: number;
}

export interface UpdateFAQData {
  question?: string;
  answer?: string;
  category?: string;
  order?: number;
  isActive?: boolean;
}

export interface FAQQuery {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

class FAQService {
  async getAllFAQs(query: FAQQuery = {}) {
    const { category, search, page = 1, limit = 50 } = query;

    let faqQuery = FAQ.query()
      .withGraphFetched('[creator(updater)]')
      .modify('active')
      .modify('ordered');

    if (category) {
      faqQuery = faqQuery.modify('byCategory', category);
    }

    if (search) {
      faqQuery = faqQuery.where(builder => {
        builder
          .where('question', 'ilike', `%${search}%`)
          .orWhere('answer', 'ilike', `%${search}%`)
          .orWhere('category', 'ilike', `%${search}%`);
      });
    }

    const total = await faqQuery.clone().resultSize();
    const offset = (page - 1) * limit;

    const faqs = await faqQuery.limit(limit).offset(offset);

    return {
      data: faqs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getFAQById(id: string) {
    const faq = await FAQ.query()
      .findById(id)
      .withGraphFetched('[creator(updater)]')
      .modify('active');

    if (!faq) {
      const error = new Error('FAQ not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    return faq;
  }

  async createFAQ(data: CreateFAQData, userId: string) {
    const { question, answer, category, order = 0 } = data;

    // Check if similar question already exists
    const existingFAQ = await FAQ.query()
      .where('question', 'ilike', `%${question.substring(0, 50)}%`)
      .modify('active')
      .first();

    if (existingFAQ) {
      const error = new Error('A similar FAQ already exists') as CustomError;
      error.statusCode = 400;
      throw error;
    }

    const faq = await FAQ.query().insert({
      question,
      answer,
      category,
      order,
      createdBy: userId,
    });

    return await FAQ.query()
      .findById(faq.id)
      .withGraphFetched('[creator]');
  }

  async updateFAQ(id: string, data: UpdateFAQData, userId: string) {
    const faq = await FAQ.query().findById(id);
    
    if (!faq) {
      const error = new Error('FAQ not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    const updatedFAQ = await FAQ.query().patchAndFetchById(id, {
      ...data,
      updatedBy: userId,
    });

    return await FAQ.query()
      .findById(updatedFAQ.id)
      .withGraphFetched('[creator(updater)]');
  }

  async deleteFAQ(id: string) {
    const faq = await FAQ.query().findById(id);
    
    if (!faq) {
      const error = new Error('FAQ not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    // Soft delete - set isActive to false
    await FAQ.query().findById(id).patch({ isActive: false });
  }

  async getCategories() {
    const categories = await FAQ.query()
      .select('category')
      .where('isActive', true)
      .groupBy('category')
      .orderBy('category');

    return categories.map(cat => cat.category);
  }

  async searchFAQs(searchTerm: string, limit: number = 10) {
    const faqs = await FAQ.query()
      .where(builder => {
        builder
          .where('question', 'ilike', `%${searchTerm}%`)
          .orWhere('answer', 'ilike', `%${searchTerm}%`);
      })
      .where('isActive', true)
      .orderByRaw(`
        CASE 
          WHEN question ILIKE ? THEN 1
          WHEN question ILIKE ? THEN 2
          WHEN answer ILIKE ? THEN 3
          ELSE 4
        END
      `, [`${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`])
      .limit(limit)
      .withGraphFetched('[creator]');

    return faqs;
  }

  async getPopularFAQs(limit: number = 10) {
    // In a real implementation, this would track view counts or usage
    // For now, return FAQs ordered by creation date
    const faqs = await FAQ.query()
      .where('isActive', true)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .withGraphFetched('[creator]');

    return faqs;
  }

  async reorderFAQs(category: string, faqIds: string[]) {
    // Verify all FAQs belong to the same category
    const faqs = await FAQ.query()
      .whereIn('id', faqIds)
      .where('category', category);

    if (faqs.length !== faqIds.length) {
      const error = new Error('Some FAQs not found or belong to different category') as CustomError;
      error.statusCode = 400;
      throw error;
    }

    // Update order for each FAQ
    const updates = faqIds.map((id, index) => 
      FAQ.query().findById(id).patch({ order: index })
    );

    await Promise.all(updates);

    return await FAQ.query()
      .where('category', category)
      .modify('active')
      .modify('ordered');
  }
}

export default new FAQService();
