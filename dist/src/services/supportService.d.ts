import SupportTicket from '../models/SupportTicket';
export interface CreateTicketData {
    title: string;
    description: string;
    category: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
}
export interface UpdateTicketData {
    title?: string;
    description?: string;
    status?: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category?: string;
    assignedTo?: string;
    response?: string;
}
export interface TicketQuery {
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: string;
    userId?: string;
    page?: number;
    limit?: number;
}
declare class SupportService {
    getAllTickets(query?: TicketQuery): Promise<{
        data: SupportTicket[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getTicketById(id: string): Promise<SupportTicket>;
    createTicket(data: CreateTicketData, userId: string): Promise<SupportTicket | undefined>;
    updateTicket(id: string, data: UpdateTicketData, userId?: string): Promise<SupportTicket | undefined>;
    deleteTicket(id: string): Promise<void>;
    getCategories(): Promise<string[]>;
    getUserTickets(userId: string, status?: string): Promise<SupportTicket[]>;
    getAssignedTickets(assignedTo: string, status?: string): Promise<SupportTicket[]>;
    getUnassignedTickets(): Promise<SupportTicket[]>;
    assignTicket(id: string, assignedTo: string): Promise<SupportTicket | undefined>;
    respondToTicket(id: string, response: string, userId: string): Promise<SupportTicket | undefined>;
    getTicketStats(): Promise<{
        total: number;
        open: number;
        in_progress: number;
        resolved: number;
        closed: number;
        unassigned: number;
    }>;
    searchTickets(searchTerm: string, limit?: number): Promise<SupportTicket[]>;
}
declare const _default: SupportService;
export default _default;
//# sourceMappingURL=supportService.d.ts.map