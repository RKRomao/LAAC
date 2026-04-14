import FAQ from '@/models/FAQ';
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
declare class FAQService {
    getAllFAQs(query?: FAQQuery): Promise<{
        data: FAQ[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getFAQById(id: string): Promise<FAQ>;
    createFAQ(data: CreateFAQData, userId: string): Promise<FAQ | undefined>;
    updateFAQ(id: string, data: UpdateFAQData, userId: string): Promise<FAQ | undefined>;
    deleteFAQ(id: string): Promise<void>;
    getCategories(): Promise<string[]>;
    searchFAQs(searchTerm: string, limit?: number): Promise<FAQ[]>;
    getPopularFAQs(limit?: number): Promise<FAQ[]>;
    reorderFAQs(category: string, faqIds: string[]): Promise<FAQ[]>;
}
declare const _default: FAQService;
export default _default;
//# sourceMappingURL=faqService.d.ts.map