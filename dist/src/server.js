"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_session_1 = __importDefault(require("express-session"));
const dotenv_1 = __importDefault(require("dotenv"));
const objection_1 = require("objection");
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const faq_1 = __importDefault(require("./routes/faq"));
const events_1 = __importDefault(require("./routes/events"));
const support_1 = __importDefault(require("./routes/support"));
const locations_1 = __importDefault(require("./routes/locations"));
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
const knexfile_1 = __importDefault(require("./knexfile"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3000');
const knex = require('knex')(knexfile_1.default[process.env.NODE_ENV || 'development']);
objection_1.Model.knex(knex);
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
            imgSrc: ["'self'", "data:", "https:", "https://tile.openstreetmap.org"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
            connectSrc: ["'self'", "data:", "https://tile.openstreetmap.org", "https://www.openstreetmap.org", "https://cdn.jsdelivr.net", "https://unpkg.com"],
            frameSrc: ["'self'", "https://www.openstreetmap.org"],
        },
    },
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, express_session_1.default)({
    secret: process.env.JWT_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
    },
}));
const passport_1 = __importDefault(require("./config/passport"));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
app.set('views', path_1.default.join(__dirname, '../views'));
app.set('view engine', 'ejs');
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/faq', faq_1.default);
app.use('/api/events', events_1.default);
app.use('/api/support', support_1.default);
app.use('/api/locations', locations_1.default);
app.get('/', (req, res) => {
    res.render('pages/home', {
        title: 'LAAC - Liga de Apoio ao Académico da Covilhã',
        user: req.session?.user,
    });
});
app.get('/faq', (req, res) => {
    res.render('pages/faq', {
        title: 'FAQ - LAAC',
        user: req.session?.user,
    });
});
app.get('/events', (req, res) => {
    res.render('pages/events', {
        title: 'Eventos - LAAC',
        user: req.session?.user,
    });
});
app.get('/support', (req, res) => {
    res.render('pages/support', {
        title: 'Suporte - LAAC',
        user: req.session?.user,
    });
});
app.get('/login', (req, res) => {
    if (req.session?.user) {
        return res.redirect('/');
    }
    res.render('pages/login', {
        title: 'Login - LAAC',
    });
});
app.get('/register', (req, res) => {
    res.redirect('/login');
});
app.get('/forgot-password', (req, res) => {
    if (req.session?.user) {
        return res.redirect('/');
    }
    res.render('pages/forgot-password', {
        title: 'Recuperar Password - LAAC',
    });
});
app.get('/locations', (req, res) => {
    res.render('pages/locations', {
        title: 'Mapa de Locais - LAAC',
        user: req.session?.user,
    });
});
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/images/favicon.png'));
});
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
    });
});
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
app.listen(PORT, '127.0.0.1', () => {
    console.log(`LAAC Platform is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`View server at http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=server.js.map