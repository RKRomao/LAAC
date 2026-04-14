import SupportTicket from '@/models/SupportTicket';
import { CustomError } from '@/middleware/errorHandler';

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

class SupportService {
  async getAllTickets(query: TicketQuery = {}) {
    const {
      status,
      priority,
      category,
      assignedTo,
      userId,
      page = 1,
      limit = 50,
    } = query;

    let ticketQuery = SupportTicket.query()
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

  async getTicketById(id: string) {
    const ticket = await SupportTicket.query()
      .findById(id)
      .withGraphFetched('[user, assignedUser]');

    if (!ticket) {
      const error = new Error('Ticket not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    return ticket;
  }

  async createTicket(data: CreateTicketData, userId: string) {
    const { title, description, category, priority = 'medium' } = data;

    const ticket = await SupportTicket.query().insert({
      title,
      description,
      category,
      priority,
      userId,
      status: 'open',
    });

    return await SupportTicket.query()
      .findById(ticket.id)
      .withGraphFetched('[user]');
  }

  async updateTicket(id: string, data: UpdateTicketData, userId?: string) {
    const ticket = await SupportTicket.query().findById(id);
    
    if (!ticket) {
      const error = new Error('Ticket not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    // If adding a response, update respondedAt
    const updateData: any = { ...data };
    if (data.response && !ticket.response) {
      updateData.respondedAt = new Date().toISOString();
    }

    const updatedTicket = await SupportTicket.query().patchAndFetchById(id, updateData);

    return await SupportTicket.query()
      .findById(updatedTicket.id)
      .withGraphFetched('[user, assignedUser]');
  }

  async deleteTicket(id: string) {
    const ticket = await SupportTicket.query().findById(id);
    
    if (!ticket) {
      const error = new Error('Ticket not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    await SupportTicket.query().deleteById(id);
  }

  async getCategories() {
    const categories = await SupportTicket.query()
      .select('category')
      .groupBy('category')
      .orderBy('category');

    return categories.map(cat => cat.category);
  }

  async getUserTickets(userId: string, status?: string) {
    let ticketQuery = SupportTicket.query()
      .modify('byUser', userId)
      .withGraphFetched('[assignedUser]');

    if (status) {
      ticketQuery = ticketQuery.modify('byStatus', status);
    }

    const tickets = await ticketQuery.modify('ordered', 'desc');

    return tickets;
  }

  async getAssignedTickets(assignedTo: string, status?: string) {
    let ticketQuery = SupportTicket.query()
      .modify('byAssignedUser', assignedTo)
      .withGraphFetched('[user]');

    if (status) {
      ticketQuery = ticketQuery.modify('byStatus', status);
    }

    const tickets = await ticketQuery.modify('ordered', 'desc');

    return tickets;
  }

  async getUnassignedTickets() {
    const tickets = await SupportTicket.query()
      .modify('unassigned')
      .withGraphFetched('[user]')
      .modify('orderedByPriority');

    return tickets;
  }

  async assignTicket(id: string, assignedTo: string) {
    const ticket = await SupportTicket.query().findById(id);
    
    if (!ticket) {
      const error = new Error('Ticket not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    const updatedTicket = await SupportTicket.query().patchAndFetchById(id, {
      assignedTo,
      status: 'in_progress',
    });

    return await SupportTicket.query()
      .findById(updatedTicket.id)
      .withGraphFetched('[user, assignedUser]');
  }

  async respondToTicket(id: string, response: string, userId: string) {
    const ticket = await SupportTicket.query().findById(id);
    
    if (!ticket) {
      const error = new Error('Ticket not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    const updatedTicket = await SupportTicket.query().patchAndFetchById(id, {
      response,
      respondedAt: new Date().toISOString(),
      status: 'resolved',
    });

    return await SupportTicket.query()
      .findById(updatedTicket.id)
      .withGraphFetched('[user, assignedUser]');
  }

  async getTicketStats() {
    // Get individual stats using separate queries for simplicity
    const [total, open, inProgress, resolved, closed, unassigned] = await Promise.all([
      SupportTicket.query().resultSize(),
      SupportTicket.query().modify('byStatus', 'open').resultSize(),
      SupportTicket.query().modify('byStatus', 'in_progress').resultSize(),
      SupportTicket.query().modify('byStatus', 'resolved').resultSize(),
      SupportTicket.query().modify('byStatus', 'closed').resultSize(),
      SupportTicket.query().modify('unassigned').resultSize(),
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

  async searchTickets(searchTerm: string, limit: number = 20) {
    const tickets = await SupportTicket.query()
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

export default new SupportService();
