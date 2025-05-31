import dotenv from 'dotenv';
import { logger } from './utils/logger';

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(`${err.name}: ${err.message}`);
  logger.error('Stack:', err.stack);
  process.exit(1);
});

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

import app from './app';
import connectDB from './config/database';

const port = process.env.PORT || 5000;

// Connect to database
connectDB();

const server = app.listen(port, () => {
  logger.info(`🚀 App running on port ${port}...`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📚 API Documentation: http://localhost:${port}/api/v1`);
  logger.info(`❤️ Health Check: http://localhost:${port}/health`);
  
  if (process.env.NODE_ENV === 'development') {
    logger.info(`🔧 MongoDB URI: ${process.env.MONGODB_URI}`);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(`${err.name}: ${err.message}`);
  logger.error('Stack:', err.stack);
  
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM (graceful shutdown)
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('💥 Process terminated!');
  });
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  logger.info('👋 SIGINT RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('💥 Process terminated!');
  });
});

// Log server start time
logger.info(`🕐 Server started at: ${new Date().toISOString()}`);

export default server;