"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRateLimitError = exports.createServiceUnavailableError = exports.createNotFoundError = exports.createValidationError = exports.createApiError = exports.ErrorHandler = exports.ApiError = void 0;
class ApiError extends Error {
    constructor(message, statusCode = 500, apiErrorCode, details) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.apiErrorCode = apiErrorCode;
        this.details = details;
    }
}
exports.ApiError = ApiError;
/**
 * Centralized error handler for API routes
 */
class ErrorHandler {
    /**
     * Handle and format errors for API responses
     */
    static handleError(error, req, res, startTime, service) {
        const processingTime = startTime ? Date.now() - startTime : undefined;
        const errorDetails = {
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            stack: error instanceof Error ? error.stack : undefined,
            statusCode: error.statusCode || 500,
            apiErrorCode: error.apiErrorCode,
            originalDetails: error.details,
            processingTime,
            timestamp: new Date().toISOString(),
            endpoint: req.originalUrl || req.url,
            requestInfo: {
                method: req.method,
                url: req.originalUrl || req.url,
                headers: this.sanitizeHeaders(req.headers),
                body: this.sanitizeRequestBody(req.body),
                params: req.params,
                query: req.query
            },
            service
        };
        // Log detailed error information
        console.error('API Error Details:', errorDetails);
        // Prepare response
        const response = {
            success: false,
            error: {
                message: errorDetails.message,
                code: errorDetails.apiErrorCode || 'INTERNAL_SERVER_ERROR',
                details: process.env.NODE_ENV === 'development' ? errorDetails : {
                    timestamp: errorDetails.timestamp,
                    processingTime: errorDetails.processingTime,
                    statusCode: errorDetails.statusCode,
                    endpoint: errorDetails.endpoint
                }
            }
        };
        res.status(errorDetails.statusCode).json(response);
    }
    /**
     * Create a validation error
     */
    static createValidationError(message, details, code = 'VALIDATION_ERROR') {
        return new ApiError(message, 400, code, details);
    }
    /**
     * Create a not found error
     */
    static createNotFoundError(resource, identifier, code = 'RESOURCE_NOT_FOUND') {
        const message = identifier
            ? `${resource} with identifier '${identifier}' not found`
            : `${resource} not found`;
        return new ApiError(message, 404, code, { resource, identifier });
    }
    /**
     * Create a service unavailable error
     */
    static createServiceUnavailableError(service, details, code = 'SERVICE_UNAVAILABLE') {
        return new ApiError(`${service} is currently unavailable`, 503, code, { service, ...details });
    }
    /**
     * Create a rate limit error
     */
    static createRateLimitError(limit, windowMs, code = 'RATE_LIMIT_EXCEEDED') {
        return new ApiError(`Rate limit exceeded: ${limit} requests per ${windowMs}ms`, 429, code, { limit, windowMs });
    }
    /**
     * Sanitize request headers for logging (remove sensitive data)
     */
    static sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
        sensitiveHeaders.forEach(header => {
            if (sanitized[header]) {
                sanitized[header] = '[REDACTED]';
            }
        });
        return sanitized;
    }
    /**
     * Sanitize request body for logging (remove sensitive data)
     */
    static sanitizeRequestBody(body) {
        if (!body || typeof body !== 'object') {
            return body;
        }
        const sanitized = { ...body };
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey'];
        const sanitizeObject = (obj) => {
            if (!obj || typeof obj !== 'object') {
                return obj;
            }
            const result = Array.isArray(obj) ? [] : {};
            for (const [key, value] of Object.entries(obj)) {
                if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
                    result[key] = '[REDACTED]';
                }
                else if (typeof value === 'object' && value !== null) {
                    result[key] = sanitizeObject(value);
                }
                else {
                    result[key] = value;
                }
            }
            return result;
        };
        return sanitizeObject(sanitized);
    }
    /**
     * Wrap async route handlers with error handling
     */
    static asyncHandler(handler, service) {
        return async (req, res) => {
            const startTime = Date.now();
            try {
                await handler(req, res);
            }
            catch (error) {
                ErrorHandler.handleError(error, req, res, startTime, service);
            }
        };
    }
    /**
     * Middleware for handling 404 errors
     */
    static notFoundHandler(req, res) {
        const error = ErrorHandler.createNotFoundError('Endpoint', req.originalUrl);
        ErrorHandler.handleError(error, req, res);
    }
    /**
     * Global error handling middleware
     */
    static globalErrorHandler(error, req, res, next) {
        ErrorHandler.handleError(error, req, res);
    }
}
exports.ErrorHandler = ErrorHandler;
/**
 * Utility functions for common error scenarios
 */
const createApiError = (message, statusCode = 500, code, details) => {
    return new ApiError(message, statusCode, code, details);
};
exports.createApiError = createApiError;
exports.createValidationError = ErrorHandler.createValidationError;
exports.createNotFoundError = ErrorHandler.createNotFoundError;
exports.createServiceUnavailableError = ErrorHandler.createServiceUnavailableError;
exports.createRateLimitError = ErrorHandler.createRateLimitError;
//# sourceMappingURL=errorHandler.js.map