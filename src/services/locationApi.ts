import axios from 'axios';
import { LocationData, ValidationResult, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorDetails = {
      timestamp: new Date().toISOString(),
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data,
      requestData: error.config?.data,
      timeout: error.config?.timeout,
      service: 'locationApi'
    };

    console.error('Location API Error Details:', errorDetails);

    if (error.response?.data?.error) {
      // Extract error message from API response
      const apiError = error.response.data.error;
      const enhancedError = new Error(apiError.message || 'API request failed');
      (enhancedError as any).details = errorDetails;
      (enhancedError as any).statusCode = error.response.status;
      (enhancedError as any).apiErrorCode = apiError.code;
      throw enhancedError;
    } else if (error.request) {
      // Network error
      const networkError = new Error(`Network error - please check your connection. Failed to reach ${error.config?.url}`);
      (networkError as any).details = errorDetails;
      (networkError as any).statusCode = 0;
      (networkError as any).isNetworkError = true;
      throw networkError;
    } else {
      // Other error
      const genericError = new Error(error.message || 'An unexpected error occurred');
      (genericError as any).details = errorDetails;
      (genericError as any).statusCode = 500;
      throw genericError;
    }
  }
);

export interface LocationValidationResponse {
  validation: ValidationResult;
  normalized: string | null;
}

export interface LocationParseResponse {
  locationData: LocationData;
  validation: ValidationResult;
}

export interface HomeLocationResponse {
  homeLocation: LocationData;
  message?: string;
}

/**
 * Location API service for frontend
 */
export const locationApi = {
  /**
   * Validate location input format
   */
  async validateLocation(location: string): Promise<LocationValidationResponse> {
    try {
      const response = await apiClient.post<ApiResponse<LocationValidationResponse>>(
        '/location/validate',
        { location }
      );
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Invalid response from validation API');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Location validation error:', error);
      throw error;
    }
  },

  /**
   * Parse location input into structured LocationData
   */
  async parseLocation(location: string): Promise<LocationParseResponse> {
    try {
      const response = await apiClient.post<ApiResponse<LocationParseResponse>>(
        '/location/parse',
        { location }
      );
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Invalid response from parsing API');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Location parsing error:', error);
      throw error;
    }
  },

  /**
   * Set user's home location
   */
  async setHomeLocation(userId: string, location: string): Promise<HomeLocationResponse> {
    try {
      const response = await apiClient.post<ApiResponse<HomeLocationResponse>>(
        '/location/home',
        { userId, location }
      );
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Invalid response from home location API');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Home location update error:', error);
      throw error;
    }
  },

  /**
   * Get user's home location
   */
  async getHomeLocation(userId: string): Promise<LocationData> {
    try {
      const response = await apiClient.get<ApiResponse<{ homeLocation: LocationData }>>(
        `/location/home/${userId}`
      );
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Invalid response from home location API');
      }
      
      return response.data.data.homeLocation;
    } catch (error) {
      console.error('Home location retrieval error:', error);
      throw error;
    }
  },

  /**
   * Health check for location API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await apiClient.get('/health');
      return response.data.status === 'ok';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
};

export default locationApi;