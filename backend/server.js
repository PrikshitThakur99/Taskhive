const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const bidRoutes = require('./routes/bids');
const walletRoutes = require('./routes/wallet');
const reviewRoutes = require('./routes/reviews');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');
const recommendRoutes = require('./routes/recommendations');

const errorHandler = require('./middleware/errorHandler');
const { setupSocketIO } = require('./utils/socket');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.CLIENT_URL
      : true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
setupSocketIO(io);
app.set('io', io);

// Middleware — allow all origins in dev, restrict in production
const corsOptions = process.env.NODE_ENV === 'production'
  ? { origin: process.env.CLIENT_URL, credentials: true }
  : { origin: true, credentials: true }; // allow any origin in dev

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recommendations', recommendRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TaskHive API is running', timestamp: new Date() });
});

// Global error handler
app.use(errorHandler);

// Database connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskhive')
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = { app, server };
