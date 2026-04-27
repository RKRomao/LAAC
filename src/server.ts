import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import dotenv from 'dotenv';
import { Knex } from 'knex';
import { Model } from 'objection';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import faqRoutes from './routes/faq';
import eventRoutes from './routes/events';
import supportRoutes from './routes/support';
import locationRoutes from './routes/locations';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Import database config
import knexConfig from './knexfile';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

// Initialize database connection
const knex = require('knex')(knexConfig[process.env.NODE_ENV || 'development']);
Model.knex(knex);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "https://tile.openstreetmap.org"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'", "data:", "https://tile.openstreetmap.org", "https://www.openstreetmap.org", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      frameSrc: ["'self'", "https://www.openstreetmap.org"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Basic middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Passport configuration
import passport from './config/passport';
app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// View engine setup
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/locations', locationRoutes);

// Web routes (for server-side rendered pages)
app.get('/', (req, res) => {
  res.render('pages/home', {
    title: 'LAAC - Liga de Apoio ao Académico da Covilhã',
    user: (req as any).session?.user,
  });
});

app.get('/faq', (req, res) => {
  res.render('pages/faq', {
    title: 'FAQ - LAAC',
    user: (req as any).session?.user,
  });
});

app.get('/events', (req, res) => {
  res.render('pages/events', {
    title: 'Eventos - LAAC',
    user: (req as any).session?.user,
  });
});

app.get('/support', (req, res) => {
  res.render('pages/support', {
    title: 'Suporte - LAAC',
    user: (req as any).session?.user,
  });
});

app.get('/login', (req, res) => {
  if ((req as any).session?.user) {
    return res.redirect('/');
  }
  res.render('pages/login', {
    title: 'Login - LAAC',
  });
});

// Redirect /register to /login for backward compatibility
app.get('/register', (req, res) => {
  res.redirect('/login');
});

app.get('/forgot-password', (req, res) => {
  if ((req as any).session?.user) {
    return res.redirect('/');
  }
  res.render('pages/forgot-password', {
    title: 'Recuperar Password - LAAC',
  });
});

app.get('/locations', (req, res) => {
  res.render('pages/locations', {
    title: 'Mapa de Locais - LAAC',
    user: (req as any).session?.user,
  });
});

// Favicon route
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/images/favicon.png'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`LAAC Platform is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`View server at http://localhost:${PORT}`);
});

export default app;
