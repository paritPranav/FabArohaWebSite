// apps/server/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const collectionRoutes = require('./routes/collections');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const paymentRoutes = require('./routes/payments');
const uploadRoutes = require('./routes/upload');
const testimonialRoutes = require('./routes/testimonials');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    process.env.ADMIN_URL  || 'http://localhost:3001',
  ],
  credentials: true,
}));
app.use(morgan('dev'));

// Razorpay webhook needs the raw body for HMAC verification — must come BEFORE express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth',        authRoutes);
app.use('/api/products',    productRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/orders',      orderRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/payments',    paymentRoutes);
app.use('/api/upload',        uploadRoutes);
app.use('/api/testimonials',  testimonialRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

// Global error handler
app.use((err, req, res, next) => {
  // Standard JS Error has a stack; Razorpay/axios throw plain objects
  if (err instanceof Error) {
    console.error(err.stack);
  } else {
    console.error('[error]', JSON.stringify(err, null, 2));
  }
  res.status(err.status || err.statusCode || 500).json({
    success: false,
    message: err.message || err?.error?.description || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
