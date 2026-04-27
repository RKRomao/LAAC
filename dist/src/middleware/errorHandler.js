"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    console.error(err);
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = { name: 'CastError', message, statusCode: 404 };
    }
    if (err.name === 'MongoError' && err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = { name: 'MongoError', message, statusCode: 400 };
    }
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message).join(', ');
        error = { name: 'ValidationError', message, statusCode: 400 };
    }
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Server Error',
        });
    }
    res.status(error.statusCode || 500).render('pages/error', {
        title: `${error.statusCode || 500} - Erro`,
        error: {
            statusCode: error.statusCode || 500,
            message: error.message || 'Server Error',
            stack: error.stack
        }
    });
    return;
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map