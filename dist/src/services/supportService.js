"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SupportTicket_1 = __importDefault(require("../models/SupportTicket"));
class SupportService {
    async getAllTickets(query = {}) {
        const { status, priority, category, assignedTo, userId, page = 1, limit = 50, } = query;
        let ticketQuery = SupportTicket_1.default.query()
            .withGraphFetched('[user, assignedUser]');
        if (status) {
            ticketQuery = ticketQuery.modify('byStatus', status);
        }
        if (priority) {
            ticketQuery = ticketQuery.modify('byPriority', priority);
        }
        if (category) {
            ticketQuery = ticketQuery.modify('byCategory', category);
        }
        if (assignedTo) {
            ticketQuery = ticketQuery.modify('byAssignedUser', assignedTo);
        }
        if (userId) {
            ticketQuery = ticketQuery.modify('byUser', userId);
        }
        const total = await ticketQuery.clone().resultSize();
        const offset = (page - 1) * limit;
        const tickets = await ticketQuery
            .modify('ordered', 'desc')
            .limit(limit)
            .offset(offset);
        return {
            data: tickets,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getTicketById(id) {
        const ticket = await SupportTicket_1.default.query()
            .findById(id)
            .withGraphFetched('[user, assignedUser]');
        if (!ticket) {
            const error = new Error('Ticket not found');
            error.statusCode = 404;
            throw error;
        }
        return ticket;
    }
    async createTicket(data, userId) {
        const { title, description, category, priority = 'medium' } = data;
        const ticket = await SupportTicket_1.default.query().insert({
            title,
            description,
            category,
            priority,
            userId,
            status: 'open',
        });
        return await SupportTicket_1.default.query()
            .findById(ticket.id)
            .withGraphFetched('[user]');
    }
    async updateTicket(id, data, userId) {
        const ticket = await SupportTicket_1.default.query().findById(id);
        if (!ticket) {
            const error = new Error('Ticket not found');
            error.statusCode = 404;
            throw error;
        }
        const updateData = { ...data };
        if (data.response && !ticket.response) {
            updateData.respondedAt = new Date().toISOString();
        }
        const updatedTicket = await SupportTicket_1.default.query().patchAndFetchById(id, updateData);
        return await SupportTicket_1.default.query()
            .findById(updatedTicket.id)
            .withGraphFetched('[user, assignedUser]');
    }
    async deleteTicket(id) {
        const ticket = await SupportTicket_1.default.query().findById(id);
        if (!ticket) {
            const error = new Error('Ticket not found');
            error.statusCode = 404;
            throw error;
        }
        await SupportTicket_1.default.query().deleteById(id);
    }
    async getCategories() {
        const categories = await SupportTicket_1.default.query()
            .select('category')
            .groupBy('category')
            .orderBy('category');
        return categories.map(cat => cat.category);
    }
    async getUserTickets(userId, status) {
        let ticketQuery = SupportTicket_1.default.query()
            .modify('byUser', userId)
            .withGraphFetched('[assignedUser]');
        if (status) {
            ticketQuery = ticketQuery.modify('byStatus', status);
        }
        const tickets = await ticketQuery.modify('ordered', 'desc');
        return tickets;
    }
    async getAssignedTickets(assignedTo, status) {
        let ticketQuery = SupportTicket_1.default.query()
            .modify('byAssignedUser', assignedTo)
            .withGraphFetched('[user]');
        if (status) {
            ticketQuery = ticketQuery.modify('byStatus', status);
        }
        const tickets = await ticketQuery.modify('ordered', 'desc');
        return tickets;
    }
    async getUnassignedTickets() {
        const tickets = await SupportTicket_1.default.query()
            .modify('unassigned')
            .withGraphFetched('[user]')
            .modify('orderedByPriority');
        return tickets;
    }
    async assignTicket(id, assignedTo) {
        const ticket = await SupportTicket_1.default.query().findById(id);
        if (!ticket) {
            const error = new Error('Ticket not found');
            error.statusCode = 404;
            throw error;
        }
        const updatedTicket = await SupportTicket_1.default.query().patchAndFetchById(id, {
            assignedTo,
            status: 'in_progress',
        });
        return await SupportTicket_1.default.query()
            .findById(updatedTicket.id)
            .withGraphFetched('[user, assignedUser]');
    }
    async respondToTicket(id, response, userId) {
        const ticket = await SupportTicket_1.default.query().findById(id);
        if (!ticket) {
            const error = new Error('Ticket not found');
            error.statusCode = 404;
            throw error;
        }
        const updatedTicket = await SupportTicket_1.default.query().patchAndFetchById(id, {
            response,
            respondedAt: new Date().toISOString(),
            status: 'resolved',
        });
        return await SupportTicket_1.default.query()
            .findById(updatedTicket.id)
            .withGraphFetched('[user, assignedUser]');
    }
    async getTicketStats() {
        const [total, open, inProgress, resolved, closed, unassigned] = await Promise.all([
            SupportTicket_1.default.query().resultSize(),
            SupportTicket_1.default.query().modify('byStatus', 'open').resultSize(),
            SupportTicket_1.default.query().modify('byStatus', 'in_progress').resultSize(),
            SupportTicket_1.default.query().modify('byStatus', 'resolved').resultSize(),
            SupportTicket_1.default.query().modify('byStatus', 'closed').resultSize(),
            SupportTicket_1.default.query().modify('unassigned').resultSize(),
        ]);
        return {
            total,
            open,
            in_progress: inProgress,
            resolved,
            closed,
            unassigned,
        };
    }
    async searchTickets(searchTerm, limit = 20) {
        const tickets = await SupportTicket_1.default.query()
            .where(builder => {
            builder
                .where('title', 'ilike', `%${searchTerm}%`)
                .orWhere('description', 'ilike', `%${searchTerm}%`)
                .orWhere('category', 'ilike', `%${searchTerm}%`);
        })
            .withGraphFetched('[user, assignedUser]')
            .orderBy('createdAt', 'desc')
            .limit(limit);
        return tickets;
    }
}
exports.default = new SupportService();
//# sourceMappingURL=supportService.js.map