// server.js
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const validateEnv = require('./config/validateEnv');
const { generalLimiter } = require('./middleware/rateLimiter');
const csrfProtection = require('./middleware/csrfProtection');
const { startOutboxWorker, stopOutboxWorker } = require('./utils/outboxProcessor');

dotenv.config();

const userRoutes = require('./routes/userRoutes');
const designRoutes = require('./routes/designRoutes');
const orderRoutes = require('./routes/orderRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const { protect } = require('./middleware/authMiddleware');

const app = express();

// ── Reverse-proxy IP resolution for production rate-limiting ─────────────────
// Ensures req.ip reflects the real client IP (via X-Forwarded-For) behind Nginx/ALB/Cloudflare
if (process.env.NODE_ENV === 'production' || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// ── Security: HTTP headers (Helmet) ──────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false, // allow images from Cloudinary and Unsplash
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", 'https://api.razorpay.com', 'https://lumberjack.razorpay.com'],
      frameSrc: ["'self'", 'https://api.razorpay.com'],
    }
  }
}));

// ── Security: CORS configuration with origin whitelist ───────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile clients, curl, testing tools)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: Origin ${origin} not allowed`), false);
  },
  credentials: true,
}));

// ── Security: Body parsing, webhook rawBody capture, & NoSQL sanitization ────
app.use(express.json({
  limit: '2mb',
  verify: (req, res, buf) => {
    // Preserve raw buffer for HMAC webhook signature verification
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(mongoSanitize()); // Strips MongoDB operators ($ and .) from inputs

// ── Serve Static Atelier Catalog Images ───────────────────────────────────────
app.use('/images/catalog', express.static(path.join(__dirname, '../frontend/public/images/catalog')));

// ── General Rate Limiting & CSRF Defense ─────────────────────────────────────
app.use('/api', generalLimiter);
app.use('/api', csrfProtection(allowedOrigins));

// ── Health & Readiness Probe Endpoints (Supports Root & /api) ────────────────
const healthHandler = (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isHealthy = dbState === 1;
  return res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: isHealthy ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
  });
};

app.get('/health', healthHandler);
app.get('/ready', healthHandler);
app.get('/api/health', healthHandler);
app.get('/api/ready', healthHandler);

// ── Domain API Routes ────────────────────────────────────────────────────────
app.use('/api/users', userRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/quotations', quotationRoutes);

// Protected Razorpay key retrieval
app.get('/api/config/razorpay', protect, (req, res) =>
  res.json({ keyId: process.env.RAZORPAY_KEY_ID })
);

app.get('/api', (req, res) => {
  res.json({ message: 'Keerti Couture Tailoring API is running' });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  // Sanitize CORS policy rejections
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ message: 'Not allowed by CORS policy' });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

// ── Server Bootstrap: Guarantees DB is connected BEFORE accepting traffic ─────
const startServer = async () => {
  try {
    validateEnv();
    await connectDB();

    if (process.env.NODE_ENV !== 'production' && process.env.AUTO_SEED === 'true') {
      await require('./seed')();
    }

    const server = app.listen(PORT, () => {
      console.log(`Keerti Couture Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      // Start background transactional outbox notification sweeper
      startOutboxWorker();
    });

    // ── Graceful Shutdown Handlers ───────────────────────────────────────────
    const handleShutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
      stopOutboxWorker();
      server.close(async () => {
        console.log('[Server] HTTP listener closed.');
        try {
          await connectDB.disconnectDB();
          console.log('[Server] Database connections closed cleanly.');
          process.exit(0);
        } catch (dbErr) {
          console.error('[Server] Error disconnecting database:', dbErr.message);
          process.exit(1);
        }
      });

      // Force exit if connections do not terminate in 10 seconds
      setTimeout(() => {
        console.error('[Server] Forceful shutdown initiated after timeout.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

    return server;
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
