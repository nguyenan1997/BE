const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const cron = require('node-cron');
const { cleanupHistoryLogs } = require('./utils/scheduleCron');

const { sequelize } = require('./config/database');
// Load models and relationships
require('./models/index');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const youtubeAuthRoutes = require('./routes/youtubeAuthRoutes');
const youtubeSyncRoutes = require('./routes/youtubeSyncRoutes');
const channelRoutes = require('./routes/channelRoutes');
const videoRoutes = require('./routes/videoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const syncHistoryRoutes = require('./routes/syncHistoryRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const { initializeScheduleCron } = require('./utils/scheduleCron');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  }
});

// Lưu mapping userId <-> socketId
const userSocketMap = new Map();

io.on('connection', (socket) => {
  // Nhận userId từ client khi kết nối
  socket.on('register', (userId) => {
    userSocketMap.set(userId, socket.id);
  });
  // Lắng nghe event job-status từ worker
  socket.on('job-status', (data) => {
    const { userId } = data;
    const targetSocketId = userSocketMap.get(userId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('job-status', data);
    }
  });
  // Xoá mapping khi disconnect
  socket.on('disconnect', () => {
    for (const [userId, sid] of userSocketMap.entries()) {
      if (sid === socket.id) userSocketMap.delete(userId);
    }
  });
});

app.set('io', io);
app.set('userSocketMap', userSocketMap);

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 60 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger UI
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'YouTube Manager API',
      version: '1.0.0',
      description: 'API documentation for YouTube Manager',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./controllers/*.js'],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/youtube-auth', youtubeAuthRoutes);
app.use('/api/youtube-sync', youtubeSyncRoutes);
app.use('/api', videoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/sync-history', syncHistoryRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    swagger: 'http://localhost:3000/api-docs'
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync database (in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database synchronized.');
    }
    
    // Initialize schedule cron
    initializeScheduleCron();
    
    // Cron job dọn dẹp lịch sử đồng bộ cũ hơn 30 ngày, chạy lúc 3h sáng mỗi ngày
    cron.schedule('0 3 * * *', async () => {
      await cleanupHistoryLogs();
    });
    
    server.listen(PORT, HOST, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, io, userSocketMap }; 