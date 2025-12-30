import { Request, Response } from 'express';
import { ApiResponse } from '../types';

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

export class ApiError extends Error {
  public statusCode: number;
  public apiErrorCode?: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, apiErrorCode?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.apiErrorCode = apiErrorCode;
    this.details = details;
  }
}

/**
 * Centralized error handler for API routes
 */
export class ErrorHandler {
  /**
   * Handle and format errors for API responses
   */
  static handleError(
    error: unknown,
    req: Request,
    res: Response,
    startTime?: number,
    service?: string
  ): void {
    const processingTime = startTime ? Date.now() - startTime : undefined;
    
    const errorDetails: ErrorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined,
      statusCode: (error as any).statusCode || 500,
      apiErrorCode: (error as any).apiErrorCode,
      originalDetails: (error as any).details,
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
    const response: ApiResponse<null> = {
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
  static createValidationError(
    message: string,
    details?: any,
    code: string = 'VALIDATION_ERROR'
  ): ApiError {
    return new ApiError(message, 400, code, details);
  }

  /**
   * Create a not found error
   */
  static createNotFoundError(
    resource: string,
    identifier?: string,
    code: string = 'RESOURCE_NOT_FOUND'
  ): ApiError {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    
    return new ApiError(message, 404, code, { resource, identifier });
  }

  /**
   * Create a service unavailable error
   */
  static createServiceUnavailableError(
    service: string,
    details?: any,
    code: string = 'SERVICE_UNAVAILABLE'
  ): ApiError {
    return new ApiError(
      `${service} is currently unavailable`,
      503,
      code,
      { service, ...details }
    );
  }

  /**
   * Create a rate limit error
   */
  static createRateLimitError(
    limit: number,
    windowMs: number,
    code: string = 'RATE_LIMIT_EXCEEDED'
  ): ApiError {
    return new ApiError(
      `Rate limit exceeded: ${limit} requests per ${windowMs}ms`,
      429,
      code,
      { limit, windowMs }
    );
  }

  /**
   * Sanitize request headers for logging (remove sensitive data)
   */
  private static sanitizeHeaders(headers: any): any {
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
  private static sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey'];
    
    const sanitizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }

      const result = Array.isArray(obj) ? [] : {};
      
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          (result as any)[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          (result as any)[key] = sanitizeObject(value);
        } else {
          (result as any)[key] = value;
        }
      }

      return result;
    };

    return sanitizeObject(sanitized);
  }

  /**
   * Wrap async route handlers with error handling
   */
  static asyncHandler(
    handler: (req: Request, res: Response) => Promise<void>,
    service?: string
  ) {
    return async (req: Request, res: Response): Promise<void> => {
      const startTime = Date.now();
      try {
        await handler(req, res);
      } catch (error) {
        ErrorHandler.handleError(error, req, res, startTime, service);
      }
    };
  }

  /**
   * Middleware for handling 404 errors
   */
  static notFoundHandler(req: Request, res: Response): void {
    const error = ErrorHandler.createNotFoundError('Endpoint', req.originalUrl);
    ErrorHandler.handleError(error, req, res);
  }

  /**
   * Global error handling middleware
   */
  static globalErrorHandler(
    error: unknown,
    req: Request,
    res: Response,
    next: any
  ): void {
    ErrorHandler.handleError(error, req, res);
  }
}

/**
 * Utility functions for common error scenarios
 */
export const createApiError = (
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): ApiError => {
  return new ApiError(message, statusCode, code, details);
};

export const createValidationError = ErrorHandler.createValidationError;
export const createNotFoundError = ErrorHandler.createNotFoundError;
export const createServiceUnavailableError = ErrorHandler.createServiceUnavailableError;
export const createRateLimitError = ErrorHandler.createRateLimitError;