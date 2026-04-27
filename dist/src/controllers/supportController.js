"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchTickets = exports.getTicketStats = exports.respondToTicket = exports.assignTicket = exports.getUnassignedTickets = exports.getAssignedTickets = exports.getUserTickets = exports.getCategories = exports.deleteTicket = exports.updateTicket = exports.createTicket = exports.getTicketById = exports.getAllTickets = void 0;
const supportService_1 = __importDefault(require("../services/supportService"));
const getAllTickets = async (req, res, next) => {
    try {
        const { status, priority, category, assignedTo, userId, page = '1', limit = '50' } = req.query;
        const result = await supportService_1.default.getAllTickets({
            status: status,
            priority: priority,
            category: category,
            assignedTo: assignedTo,
            userId: userId,
            page: parseInt(page),
            limit: parseInt(limit),
        });
        res.json({
            success: true,
            data: result,
            message: 'Support tickets retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllTickets = getAllTickets;
const getTicketById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const ticket = await supportService_1.default.getTicketById(id);
        res.json({
            success: true,
            data: ticket,
            message: 'Support ticket retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTicketById = getTicketById;
const createTicket = async (req, res, next) => {
    try {
        const { title, description, category, priority } = req.body;
        const userId = req.user.id;
        const ticket = await supportService_1.default.createTicket({
            title,
            description,
            category,
            priority,
        }, userId);
        res.status(201).json({
            success: true,
            data: ticket,
            message: 'Support ticket created successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createTicket = createTicket;
const updateTicket = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, status, priority, category, assignedTo, response } = req.body;
        const userId = req.user.id;
        const ticket = await supportService_1.default.updateTicket(id, {
            title,
            description,
            status,
            priority,
            category,
            assignedTo,
            response,
        }, userId);
        res.json({
            success: true,
            data: ticket,
            message: 'Support ticket updated successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTicket = updateTicket;
const deleteTicket = async (req, res, next) => {
    try {
        const { id } = req.params;
        await supportService_1.default.deleteTicket(id);
        res.json({
            success: true,
            message: 'Support ticket deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTicket = deleteTicket;
const getCategories = async (req, res, next) => {
    try {
        const categories = await supportService_1.default.getCategories();
        res.json({
            success: true,
            data: categories,
            message: 'Support ticket categories retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCategories = getCategories;
const getUserTickets = async (req, res, next) => {
    try {
        const { status } = req.query;
        const userId = req.user.id;
        const tickets = await supportService_1.default.getUserTickets(userId, status);
        res.json({
            success: true,
            data: tickets,
            message: 'User support tickets retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserTickets = getUserTickets;
const getAssignedTickets = async (req, res, next) => {
    try {
        const { status } = req.query;
        const assignedTo = req.user.id;
        const tickets = await supportService_1.default.getAssignedTickets(assignedTo, status);
        res.json({
            success: true,
            data: tickets,
            message: 'Assigned support tickets retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAssignedTickets = getAssignedTickets;
const getUnassignedTickets = async (req, res, next) => {
    try {
        const tickets = await supportService_1.default.getUnassignedTickets();
        res.json({
            success: true,
            data: tickets,
            message: 'Unassigned support tickets retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUnassignedTickets = getUnassignedTickets;
const assignTicket = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { assignedTo } = req.body;
        const ticket = await supportService_1.default.assignTicket(id, assignedTo);
        res.json({
            success: true,
            data: ticket,
            message: 'Support ticket assigned successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.assignTicket = assignTicket;
const respondToTicket = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { response } = req.body;
        const userId = req.user.id;
        const ticket = await supportService_1.default.respondToTicket(id, response, userId);
        res.json({
            success: true,
            data: ticket,
            message: 'Response added to support ticket successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.respondToTicket = respondToTicket;
const getTicketStats = async (req, res, next) => {
    try {
        const stats = await supportService_1.default.getTicketStats();
        res.json({
            success: true,
            data: stats,
            message: 'Support ticket statistics retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTicketStats = getTicketStats;
const searchTickets = async (req, res, next) => {
    try {
        const { q: searchTerm, limit = '20' } = req.query;
        if (!searchTerm) {
            res.status(400).json({
                success: false,
                message: 'Search term is required',
            });
            return;
        }
        const tickets = await supportService_1.default.searchTickets(searchTerm, parseInt(limit));
        res.json({
            success: true,
            data: tickets,
            message: 'Support tickets searched successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.searchTickets = searchTickets;
//# sourceMappingURL=supportController.js.map