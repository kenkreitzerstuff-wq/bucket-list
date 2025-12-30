import { Request, Response } from 'express';
export interface ErrorDetails {
    message: string;
    stack?: string;
    statusCode: number;
    apiErrorCode?: string;
    originalDetails?: any;
    processingTime?: number;
    timestamp: string;
    endpoint: string;
    requestInfo?: {
        method: string;
        url: string;
        headers?: any;
        body?: any;
        params?: any;
        query?: any;
    };
    service?: string;
}
export declare class ApiError extends Error {
    statusCode: number;
    apiErrorCode?: string;
    details?: any;
    constructor(message: string, statusCode?: number, apiErrorCode?: string, details?: any);
}
/**
 * Centralized error handler for API routes
 */
export declare class ErrorHandler {
    /**
     * Handle and format errors for API responses
     */
    static handleError(error: unknown, req: Request, res: Response, startTime?: number, service?: string): void;
    /**
     * Create a validation error
     */
    static createValidationError(message: string, details?: any, code?: string): ApiError;
    /**
     * Create a not found error
     */
    static createNotFoundError(resource: string, identifier?: string, code?: string): ApiError;
    /**
     * Create a service unavailable error
     */
    static createServiceUnavailableError(service: string, details?: any, code?: string): ApiError;
    /**
     * Create a rate limit error
     */
    static createRateLimitError(limit: number, windowMs: number, code?: string): ApiError;
    /**
     * Sanitize request headers for logging (remove sensitive data)
     */
    private static sanitizeHeaders;
    /**
     * Sanitize request body for logging (remove sensitive data)
     */
    private static sanitizeRequestBody;
    /**
     * Wrap async route handlers with error handling
     */
    static asyncHandler(handler: (req: Request, res: Response) => Promise<void>, service?: string): (req: Request, res: Response) => Promise<void>;
    /**
     * Middleware for handling 404 errors
     */
    static notFoundHandler(req: Request, res: Response): void;
    /**
     * Global error handling middleware
     */
    static globalErrorHandler(error: unknown, req: Request, res: Response, next: any): void;
}
/**
 * Utility functions for common error scenarios
 */
export declare const createApiError: (message: string, statusCode?: number, code?: string, details?: any) => ApiError;
export declare const createValidationError: typeof ErrorHandler.createValidationError;
export declare const createNotFoundError: typeof ErrorHandler.createNotFoundError;
export declare const createServiceUnavailableError: typeof ErrorHandler.createServiceUnavailableError;
export declare const createRateLimitError: typeof ErrorHandler.createRateLimitError;
//# sourceMappingURL=errorHandler.d.ts.map