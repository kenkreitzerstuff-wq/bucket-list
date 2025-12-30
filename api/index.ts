import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import locationRoutes from '../backend/src/routes/locationRoutes';
import travelInputRoutes from '../backend/src/routes/travelInputRoutes';
import recommendationRoutes from '../backend/src/routes/recommendationRoutes';
import bucketListRoutes from '../backend/src/routes/bucketListRoutes';
import { ErrorHandler } from '../backend/src/utils/errorHandler';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://bucket-list-kenkreitzerstuff-wq.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'travel-bucket-list-backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    endpoints: [
      '/api/location',
      '/api/travel-input', 
      '/api/recommendations',
      '/api/bucket-list'
    ]
  });
});

// API routes
app.use('/api/location', locationRoutes);
app.use('/api/travel-input', travelInputRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api', bucketListRoutes);

// 404 handler for API routes
app.use('/api', ErrorHandler.notFoundHandler);

// Global error handling middleware
app.use(ErrorHandler.globalErrorHandler);

// Export the Express app as a Vercel serverless function
export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};