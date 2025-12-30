"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const locationRoutes_1 = __importDefault(require("./routes/locationRoutes"));
const travelInputRoutes_1 = __importDefault(require("./routes/travelInputRoutes"));
const recommendationRoutes_1 = __importDefault(require("./routes/recommendationRoutes"));
const bucketListRoutes_1 = __importDefault(require("./routes/bucketListRoutes"));
const errorHandler_1 = require("./utils/errorHandler");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoint with detailed information
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'travel-bucket-list-backend',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
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
app.use('/api/location', locationRoutes_1.default);
app.use('/api/travel-input', travelInputRoutes_1.default);
app.use('/api/recommendations', recommendationRoutes_1.default);
app.use('/api', bucketListRoutes_1.default);
// 404 handler for API routes
app.use('/api', errorHandler_1.ErrorHandler.notFoundHandler);
// Global error handling middleware
app.use(errorHandler_1.ErrorHandler.globalErrorHandler);
// 404 handler for all other routes
app.use('*', (req, res) => {
    const error = {
        success: false,
        error: {
            message: 'Route not found',
            code: 'ROUTE_NOT_FOUND',
            details: {
                path: req.originalUrl,
                method: req.method,
                timestamp: new Date().toISOString(),
                availableRoutes: [
                    'GET /api/health',
                    'POST /api/location/validate',
                    'POST /api/location/parse',
                    'POST /api/location/home',
                    'GET /api/location/home/:userId',
                    'POST /api/travel-input/validate',
                    'POST /api/travel-input/follow-up-questions',
                    'POST /api/travel-input/store',
                    'GET /api/travel-input/:userId',
                    'DELETE /api/travel-input/:userId',
                    'POST /api/recommendations/generate',
                    'POST /api/recommendations/follow-up-questions',
                    'POST /api/recommendations/integrate-answers',
                    'GET /api/recommendations/bucket-list',
                    'GET /api/bucket-list',
                    'POST /api/bucket-list',
                    'PUT /api/bucket-list/:id',
                    'DELETE /api/bucket-list/:id'
                ]
            }
        }
    };
    res.status(404).json(error);
});
// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});
// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Promise Rejection:', reason);
    console.error('Promise:', promise);
    // Don't exit in production, just log
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});
// Uncaught exception handler
process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    process.exit(1);
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Travel Bucket List Backend running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔧 CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});
exports.default = app;
//# sourceMappingURL=server.js.map