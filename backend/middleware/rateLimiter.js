const rateLimit = require('express-rate-limit');

const isTestEnv = process.env.NODE_ENV === 'test';

// ── Auth limiter: 5 attempts per 15 minutes per IP (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 1000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
  message: {
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

// ── Upload limiter: 10 uploads per 15 minutes per IP
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
  message: {
    message: 'Too many upload requests. Please try again after 15 minutes.',
  },
});

// ── Order limiter: 20 order creations per hour per IP
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isTestEnv ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
  message: {
    message: 'Too many orders placed. Please try again after an hour.',
  },
});

// ── Appointment limiter: 15 booking attempts per 15 minutes per IP
const appointmentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 1000 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
  message: {
    message: 'Too many appointment requests. Please try again after 15 minutes.',
  },
});

// ── Quotation limiter: 10 design requests per 15 minutes per IP
const quotationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
  message: {
    message: 'Too many design quotation requests. Please try again after 15 minutes.',
  },
});

// ── Payment limiter: 30 payment operations per 15 minutes per IP
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
  message: {
    message: 'Too many payment requests. Please try again later.',
  },
});

// ── General API limiter: 200 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 5000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
  message: {
    message: 'Too many requests from this IP. Please try again later.',
  },
});

module.exports = {
  authLimiter,
  uploadLimiter,
  orderLimiter,
  appointmentLimiter,
  quotationLimiter,
  paymentLimiter,
  generalLimiter,
};
