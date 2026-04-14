"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const FAQ_1 = __importDefault(require("@/models/FAQ"));
class FAQService {
    async getAllFAQs(query = {}) {
        const { category, search, page = 1, limit = 50 } = query;
        let faqQuery = FAQ_1.default.query()
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
    async getFAQById(id) {
        const faq = await FAQ_1.default.query()
            .findById(id)
            .withGraphFetched('[creator(updater)]')
            .modify('active');
        if (!faq) {
            const error = new Error('FAQ not found');
            error.statusCode = 404;
            throw error;
        }
        return faq;
    }
    async createFAQ(data, userId) {
        const { question, answer, category, order = 0 } = data;
        const existingFAQ = await FAQ_1.default.query()
            .where('question', 'ilike', `%${question.substring(0, 50)}%`)
            .modify('active')
            .first();
        if (existingFAQ) {
            const error = new Error('A similar FAQ already exists');
            error.statusCode = 400;
            throw error;
        }
        const faq = await FAQ_1.default.query().insert({
            question,
            answer,
            category,
            order,
            createdBy: userId,
        });
        return await FAQ_1.default.query()
            .findById(faq.id)
            .withGraphFetched('[creator]');
    }
    async updateFAQ(id, data, userId) {
        const faq = await FAQ_1.default.query().findById(id);
        if (!faq) {
            const error = new Error('FAQ not found');
            error.statusCode = 404;
            throw error;
        }
        const updatedFAQ = await FAQ_1.default.query().patchAndFetchById(id, {
            ...data,
            updatedBy: userId,
        });
        return await FAQ_1.default.query()
            .findById(updatedFAQ.id)
            .withGraphFetched('[creator(updater)]');
    }
    async deleteFAQ(id) {
        const faq = await FAQ_1.default.query().findById(id);
        if (!faq) {
            const error = new Error('FAQ not found');
            error.statusCode = 404;
            throw error;
        }
        await FAQ_1.default.query().findById(id).patch({ isActive: false });
    }
    async getCategories() {
        const categories = await FAQ_1.default.query()
            .select('category')
            .where('isActive', true)
            .groupBy('category')
            .orderBy('category');
        return categories.map(cat => cat.category);
    }
    async searchFAQs(searchTerm, limit = 10) {
        const faqs = await FAQ_1.default.query()
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
    async getPopularFAQs(limit = 10) {
        const faqs = await FAQ_1.default.query()
            .where('isActive', true)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .withGraphFetched('[creator]');
        return faqs;
    }
    async reorderFAQs(category, faqIds) {
        const faqs = await FAQ_1.default.query()
            .whereIn('id', faqIds)
            .where('category', category);
        if (faqs.length !== faqIds.length) {
            const error = new Error('Some FAQs not found or belong to different category');
            error.statusCode = 400;
            throw error;
        }
        const updates = faqIds.map((id, index) => FAQ_1.default.query().findById(id).patch({ order: index }));
        await Promise.all(updates);
        return await FAQ_1.default.query()
            .where('category', category)
            .modify('active')
            .modify('ordered');
    }
}
exports.default = new FAQService();
//# sourceMappingURL=faqService.js.map