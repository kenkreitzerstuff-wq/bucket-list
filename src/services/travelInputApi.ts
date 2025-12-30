import axios from 'axios';
import { TravelInputData, ValidationResult, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD 
    ? '/api'  // In production, use relative path to same domain
    : 'http://localhost:3001/api'  // In development, use localhost
);

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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
      service: 'travelInputApi'
    };

    console.error('Travel Input API Error Details:', errorDetails);

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

export interface TravelInputValidationResponse {
  validation: ValidationResult;
  completenessScore: number;
  incompleteAnalysis: {
    needsFollowUp: boolean;
    incompleteAreas: string[];
    suggestions: string[];
  };
  normalized: TravelInputData | null;
}

export interface FollowUpQuestionsResponse {
  questions: Array<{
    id: string;
    question: string;
    type: 'text' | 'multiple-choice' | 'range';
    options?: string[];
    context: string;
  }>;
  incompleteAnalysis: {
    needsFollowUp: boolean;
    incompleteAreas: string[];
    suggestions: string[];
  };
  hasFollowUp: boolean;
}

export interface TravelInputStorageResponse {
  message: string;
  completenessScore: number;
  storedInput: TravelInputData;
}

export interface TravelInputRetrievalResponse {
  travelInput: TravelInputData;
  completenessScore: number;
  incompleteAnalysis: {
    needsFollowUp: boolean;
    incompleteAreas: string[];
    suggestions: string[];
  };
}

/**
 * Travel Input API service for frontend
 */
export const travelInputApi = {
  /**
   * Validate travel input data
   */
  async validateTravelInput(travelInput: TravelInputData): Promise<TravelInputValidationResponse> {
    try {
      const response = await apiClient.post<ApiResponse<TravelInputValidationResponse>>(
        '/travel-input/validate',
        { travelInput }
      );
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Invalid response from validation API');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Travel input validation error:', error);
      throw error;
    }
  },

  /**
   * Generate follow-up questions for incomplete input
   */
  async generateFollowUpQuestions(travelInput: TravelInputData): Promise<FollowUpQuestionsResponse> {
    try {
      const response = await apiClient.post<ApiResponse<FollowUpQuestionsResponse>>(
        '/travel-input/follow-up-questions',
        { travelInput }
      );
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Invalid response from follow-up questions API');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Follow-up questions generation error:', error);
      throw error;
    }
  },

  /**
   * Store travel input data for a user
   */
  async storeTravelInput(userId: string, travelInput: TravelInputData): Promise<TravelInputStorageResponse> {
    try {
      const response = await apiClient.post<ApiResponse<TravelInputStorageResponse>>(
        '/travel-input/store',
        { userId, travelInput }
      );
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Invalid response from storage API');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Travel input storage error:', error);
      throw error;
    }
  },

  /**
   * Retrieve stored travel input data for a user
   */
  async getTravelInput(userId: string): Promise<TravelInputRetrievalResponse> {
    try {
      const response = await apiClient.get<ApiResponse<TravelInputRetrievalResponse>>(
        `/travel-input/${userId}`
      );
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Invalid response from retrieval API');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Travel input retrieval error:', error);
      throw error;
    }
  },

  /**
   * Clear stored travel input data for a user
   */
  async clearTravelInput(userId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(
        `/travel-input/${userId}`
      );
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Invalid response from clearing API');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Travel input clearing error:', error);
      throw error;
    }
  },

  /**
   * Validate and get completeness score in one call
   */
  async validateAndScore(travelInput: TravelInputData): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    completenessScore: number;
    needsFollowUp: boolean;
    suggestions: string[];
  }> {
    try {
      const validation = await this.validateTravelInput(travelInput);
      
      return {
        isValid: validation.validation.isValid,
        errors: validation.validation.errors,
        warnings: validation.validation.warnings || [],
        completenessScore: validation.completenessScore,
        needsFollowUp: validation.incompleteAnalysis.needsFollowUp,
        suggestions: validation.incompleteAnalysis.suggestions
      };
    } catch (error) {
      console.error('Validation and scoring error:', error);
      throw error;
    }
  }
};

export default travelInputApi;