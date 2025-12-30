import { UserProfile, TravelInputData, Recommendation, FollowUpQuestion, ApiResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * API client for recommendation-related operations
 */
export class RecommendationApi {
  /**
   * Generate travel recommendations based on user profile and input
   */
  static async generateRecommendations(
    userProfile: UserProfile,
    travelInput: TravelInputData
  ): Promise<Recommendation[]> {
    const startTime = Date.now();
    try {
      const response = await fetch(`${API_BASE_URL}/recommendations/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfile,
          travelInput
        })
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorDetails = {
          timestamp: new Date().toISOString(),
          url: `${API_BASE_URL}/recommendations/generate`,
          method: 'POST',
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          errorData,
          requestData: {
            userProfile: {
              hasHomeLocation: !!userProfile?.homeLocation,
              homeLocationCity: userProfile?.homeLocation?.city,
              hasPreferences: !!userProfile?.preferences
            },
            travelInput: {
              destinationCount: travelInput?.destinations?.length || 0,
              experienceCount: travelInput?.experiences?.length || 0,
              hasPreferences: !!travelInput?.preferences
            }
          },
          responseTime,
          service: 'RecommendationApi.generateRecommendations'
        };

        console.error('Recommendation API Error Details:', errorDetails);

        const enhancedError = new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        (enhancedError as any).details = errorDetails;
        (enhancedError as any).statusCode = response.status;
        (enhancedError as any).apiErrorCode = errorData.error?.code;
        throw enhancedError;
      }

      const result: ApiResponse<Recommendation[]> = await response.json();
      
      if (!result.success) {
        const errorDetails = {
          timestamp: new Date().toISOString(),
          url: `${API_BASE_URL}/recommendations/generate`,
          method: 'POST',
          status: response.status,
          result,
          responseTime,
          service: 'RecommendationApi.generateRecommendations'
        };

        console.error('Recommendation API Logic Error:', errorDetails);

        const enhancedError = new Error(result.error?.message || 'Failed to generate recommendations');
        (enhancedError as any).details = errorDetails;
        (enhancedError as any).statusCode = 500;
        (enhancedError as any).apiErrorCode = result.error?.code;
        throw enhancedError;
      }

      return result.data || [];
    } catch (error) {
      if ((error as any).details) {
        // Re-throw enhanced errors
        throw error;
      }

      const errorDetails = {
        timestamp: new Date().toISOString(),
        url: `${API_BASE_URL}/recommendations/generate`,
        method: 'POST',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        responseTime: Date.now() - startTime,
        service: 'RecommendationApi.generateRecommendations'
      };

      console.error('Recommendation API Unexpected Error:', errorDetails);

      const enhancedError = error instanceof Error ? error : new Error('Failed to generate recommendations');
      (enhancedError as any).details = errorDetails;
      (enhancedError as any).statusCode = 500;
      throw enhancedError;
    }
  }

  /**
   * Generate contextual follow-up questions based on user input
   */
  static async generateFollowUpQuestions(
    travelInput: TravelInputData,
    userProfile: UserProfile
  ): Promise<FollowUpQuestion[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/recommendations/follow-up-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          travelInput,
          userProfile
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<FollowUpQuestion[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to generate follow-up questions');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error generating follow-up questions:', error);
      throw error instanceof Error ? error : new Error('Failed to generate follow-up questions');
    }
  }

  /**
   * Process follow-up answers and get updated recommendations
   */
  static async integrateFollowUpAnswers(
    originalInput: TravelInputData,
    followUpAnswers: { [questionId: string]: string | string[] },
    userProfile: UserProfile
  ): Promise<{
    updatedInput: TravelInputData;
    recommendations: Recommendation[];
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/recommendations/integrate-answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalInput,
          followUpAnswers,
          userProfile
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<{
        updatedInput: TravelInputData;
        recommendations: Recommendation[];
      }> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to integrate follow-up answers');
      }

      return result.data || { updatedInput: originalInput, recommendations: [] };
    } catch (error) {
      console.error('Error integrating follow-up answers:', error);
      throw error instanceof Error ? error : new Error('Failed to integrate follow-up answers');
    }
  }

  /**
   * Get bucket list data for reference
   */
  static async getBucketListData(filters?: {
    status?: 'all' | 'incomplete' | 'completed';
    priority?: number;
    gailInterest?: 'HIGH' | 'LOW';
    tags?: string[];
    difficulty?: 'easy' | 'moderate' | 'challenging';
    minDuration?: number;
    maxDuration?: number;
  }): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            if (Array.isArray(value)) {
              value.forEach(v => params.append(key, v.toString()));
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      const url = `${API_BASE_URL}/recommendations/bucket-list${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<any[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch bucket list data');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching bucket list data:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch bucket list data');
    }
  }

  /**
   * Utility method to handle API errors consistently
   */
  static handleApiError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    
    if (typeof error === 'string') {
      return new Error(error);
    }
    
    return new Error('An unexpected error occurred');
  }

  /**
   * Check if the API is available
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return response.ok;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
}