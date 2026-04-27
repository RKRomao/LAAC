import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

// Redis client for caching
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`
});

redisClient.on('error', (err) => console.log('Redis Client Error:', err));

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

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

// JWT verification middleware
const verifyToken = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Service URLs
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  events: process.env.EVENTS_SERVICE_URL || 'http://localhost:3002',
  maps: process.env.MAPS_SERVICE_URL || 'http://localhost:3003',
  feed: process.env.FEED_SERVICE_URL || 'http://localhost:3004',
  chat: process.env.CHAT_SERVICE_URL || 'http://localhost:3005',
};

// Proxy middleware configuration
const proxyOptions = {
  changeOrigin: true,
  timeout: 30000,
  onError: (err: any, req: any, res: any) => {
    console.error('Proxy error:', err);
    res.status(502).json({ error: 'Service unavailable' });
  },
};

// Route proxies
app.use('/api/auth', createProxyMiddleware({
  target: services.auth,
  ...proxyOptions,
  pathRewrite: {
    '^/api/auth': '/api',
  },
}));

app.use('/api/events', verifyToken, createProxyMiddleware({
  target: services.events,
  ...proxyOptions,
  pathRewrite: {
    '^/api/events': '/api',
  },
}));

app.use('/api/locations', verifyToken, createProxyMiddleware({
  target: services.maps,
  ...proxyOptions,
  pathRewrite: {
    '^/api/locations': '/api',
  },
}));

app.use('/api/feed', verifyToken, createProxyMiddleware({
  target: services.feed,
  ...proxyOptions,
  pathRewrite: {
    '^/api/feed': '/api',
  },
}));

app.use('/api/chat', verifyToken, createProxyMiddleware({
  target: services.chat,
  ...proxyOptions,
  pathRewrite: {
    '^/api/chat': '/api',
  },
}));

app.use('/api/users', verifyToken, createProxyMiddleware({
  target: services.auth,
  ...proxyOptions,
  pathRewrite: {
    '^/api/users': '/api',
  },
}));

app.use('/api/support', verifyToken, createProxyMiddleware({
  target: services.auth,
  ...proxyOptions,
  pathRewrite: {
    '^/api/support': '/api',
  },
}));

app.use('/api/faq', verifyToken, createProxyMiddleware({
  target: services.auth,
  ...proxyOptions,
  pathRewrite: {
    '^/api/faq': '/api',
  },
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'API Gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// Service health check endpoint
app.get('/health/services', async (req, res) => {
  const serviceHealth = await Promise.allSettled([
    fetch(`${services.auth}/health`),
    fetch(`${services.events}/health`),
    fetch(`${services.maps}/health`),
    fetch(`${services.feed}/health`),
    fetch(`${services.chat}/health`),
  ]);

  const results = {
    auth: serviceHealth[0].status === 'fulfilled' ? 'healthy' : 'unhealthy',
    events: serviceHealth[1].status === 'fulfilled' ? 'healthy' : 'unhealthy',
    maps: serviceHealth[2].status === 'fulfilled' ? 'healthy' : 'unhealthy',
    feed: serviceHealth[3].status === 'fulfilled' ? 'healthy' : 'unhealthy',
    chat: serviceHealth[4].status === 'fulfilled' ? 'healthy' : 'unhealthy',
  };

  res.json(results);
});

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Gateway is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Service endpoints:');
  console.log(`  Auth: ${services.auth}`);
  console.log(`  Events: ${services.events}`);
  console.log(`  Maps: ${services.maps}`);
  console.log(`  Feed: ${services.feed}`);
  console.log(`  Chat: ${services.chat}`);
});

export default app;
