import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { globalErrorHandler, AppError } from './middlewares/error';
import { logger } from './utils/logger';

// Import routes
import authRoutes from './routes/auth.route';
import branchRoutes from './routes/branch.route';
import staffRoutes from './routes/staff.route';
import serviceRoutes from './routes/service.route';
import customerRoutes from './routes/customer.route';

const app: Application = express();

// Global middlewares

// Basic security headers
app.use(helmet());

// Development logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    }
  }
}));

// Body parser middleware
app.use(express.json({ 
  limit: '10kb',
  type: 'application/json'
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10kb' 
}));

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://serviceport-rho.vercel.app',
      'https://serviceport-git-main-pashokgithubs-projects.vercel.app',
      'http://localhost:3000', 
      'http://localhost:3001', 
      'http://localhost:5173'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Test middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  // Add request logging if needed
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/branches', branchRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/customers', customerRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'Service Management API is running!',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    status: 'OK'
  };

  try {
    res.status(200).json({
      status: 'success',
      data: healthCheck
    });
  } catch (error) {
    healthCheck.message = 'Service Management API is not healthy';
    healthCheck.status = 'ERROR';
    res.status(503).json({
      status: 'error',
      data: healthCheck
    });
  }
});

// API documentation endpoint
app.get('/api/v1', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Service Management API v1',
    endpoints: {
      auth: '/api/v1/auth',
      branches: '/api/v1/branches',
      staff: '/api/v1/staff',
      services: '/api/v1/services',
      customers: '/api/v1/customers'
    },
    documentation: 'Please refer to the API documentation for detailed endpoint information'
  });
});

// Handle undefined routes
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

export default app;