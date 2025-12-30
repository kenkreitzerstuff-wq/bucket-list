import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { locationApi } from '../services/locationApi';
import { travelInputApi } from '../services/travelInputApi';
import { RecommendationApi } from '../services/recommendationApi';
import { TravelInputData, UserProfile, LocationData } from '../types';

/**
 * API Integration tests that test actual API endpoints
 * These tests verify the frontend-backend integration
 */
describe('API Integration Tests', () => {
  const testUserId = 'api-integration-test-user';
  
  // Mock fetch for controlled testing
  const originalFetch = global.fetch;
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('Location API Integration', () => {
    test('Successfully validates and parses location', async () => {
      // Mock successful location validation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            isValid: true,
            normalizedLocation: 'San Francisco, California, United States',
            confidence: 0.95
          }
        })
      });

      // Mock successful location parsing
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            city: 'San Francisco',
            country: 'United States',
            coordinates: { lat: 37.7749, lng: -122.4194 },
            airportCode: 'SFO'
          }
        })
      });

      const validation = await locationApi.validateLocation('San Francisco, CA');
      expect(validation.isValid).toBe(true);
      expect(validation.normalizedLocation).toBe('San Francisco, California, United States');

      const locationData = await locationApi.parseLocation('San Francisco, CA');
      expect(locationData.city).toBe('San Francisco');
      expect(locationData.country).toBe('United States');
      expect(locationData.coordinates).toEqual({ lat: 37.7749, lng: -122.4194 });
    });

    test('Handles location API errors gracefully', async () => {
      // Mock API error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          success: false,
          error: {
            message: 'Invalid location format',
            code: 'INVALID_LOCATION'
          }
        })
      });

      await expect(locationApi.validateLocation('Invalid Location')).rejects.toThrow('Invalid location format');
    });

    test('Successfully stores and retrieves home location', async () => {
      const locationData: LocationData = {
        city: 'Tokyo',
        country: 'Japan',
        coordinates: { lat: 35.6762, lng: 139.6503 }
      };

      // Mock successful storage
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { message: 'Home location stored successfully' }
        })
      });

      // Mock successful retrieval
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: locationData
        })
      });

      await locationApi.setHomeLocation(testUserId, 'Tokyo, Japan');
      const retrieved = await locationApi.getHomeLocation(testUserId);
      
      expect(retrieved).toEqual(locationData);
    });
  });

  describe('Travel Input API Integration', () => {
    test('Successfully validates and stores travel input', async () => {
      const travelInput: TravelInputData = {
        destinations: ['Paris, France', 'Rome, Italy'],
        experiences: ['Visit museums', 'Try local cuisine'],
        preferences: {
          budgetRange: { min: 2000, max: 5000, currency: 'USD' },
          travelStyle: 'mid-range',
          interests: ['culture', 'food'],
          travelDuration: 'medium',
          groupSize: 2
        }
      };

      // Mock validation response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            isValid: true,
            errors: [],
            completenessScore: 85
          }
        })
      });

      // Mock storage response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            storedInput: travelInput,
            completenessScore: 85,
            incompleteAnalysis: {
              needsFollowUp: false,
              incompleteAreas: [],
              suggestions: []
            }
          }
        })
      });

      const validation = await travelInputApi.validateTravelInput(travelInput);
      expect(validation.isValid).toBe(true);
      expect(validation.completenessScore).toBe(85);

      const storeResult = await travelInputApi.storeTravelInput(testUserId, travelInput);
      expect(storeResult.storedInput).toEqual(travelInput);
      expect(storeResult.completenessScore).toBe(85);
    });

    test('Generates follow-up questions for incomplete input', async () => {
      const incompleteInput: TravelInputData = {
        destinations: ['Europe'],
        experiences: ['adventure']
      };

      // Mock follow-up questions response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            hasFollowUp: true,
            questions: [
              {
                id: 'dest-clarify-1',
                question: 'Which specific countries in Europe interest you most?',
                type: 'multiple-choice',
                options: ['France', 'Italy', 'Spain', 'Germany'],
                context: 'destination-clarification'
              },
              {
                id: 'exp-clarify-1',
                question: 'What type of adventure activities do you enjoy?',
                type: 'multiple-choice',
                options: ['Hiking', 'Water sports', 'Extreme sports', 'Cultural exploration'],
                context: 'experience-clarification'
              }
            ]
          }
        })
      });

      const followUpResult = await travelInputApi.generateFollowUpQuestions(incompleteInput);
      expect(followUpResult.hasFollowUp).toBe(true);
      expect(followUpResult.questions).toHaveLength(2);
      expect(followUpResult.questions[0].question).toContain('Europe');
      expect(followUpResult.questions[1].question).toContain('adventure');
    });

    test('Retrieves stored travel input', async () => {
      const storedInput: TravelInputData = {
        destinations: ['Barcelona, Spain'],
        experiences: ['Flamenco shows', 'Tapas tours'],
        preferences: {
          budgetRange: { min: 1500, max: 3500, currency: 'EUR' },
          travelStyle: 'cultural',
          interests: ['art', 'food', 'music'],
          travelDuration: 'short',
          groupSize: 2
        }
      };

      // Mock retrieval response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            travelInput: storedInput,
            completenessScore: 90,
            incompleteAnalysis: {
              needsFollowUp: false,
              incompleteAreas: [],
              suggestions: []
            }
          }
        })
      });

      const result = await travelInputApi.getTravelInput(testUserId);
      expect(result.travelInput).toEqual(storedInput);
      expect(result.completenessScore).toBe(90);
    });
  });

  describe('Recommendation API Integration', () => {
    test('Successfully generates recommendations', async () => {
      const userProfile: UserProfile = {
        id: testUserId,
        homeLocation: {
          city: 'New York',
          country: 'United States',
          coordinates: { lat: 40.7128, lng: -74.0060 }
        },
        preferences: {
          budgetRange: { min: 3000, max: 7000, currency: 'USD' },
          travelStyle: 'luxury',
          interests: ['culture', 'fine-dining'],
          travelDuration: 'medium',
          groupSize: 2
        },
        bucketList: []
      };

      const travelInput: TravelInputData = {
        destinations: ['Paris, France', 'Milan, Italy'],
        experiences: ['Michelin star dining', 'Fashion shows', 'Art galleries'],
        preferences: userProfile.preferences
      };

      const mockRecommendations = [
        {
          type: 'destination' as const,
          title: 'Lyon, France',
          description: 'Culinary capital of France with exceptional fine dining scene',
          reasoning: 'Based on your interest in fine dining and proximity to Paris',
          confidence: 0.92,
          relatedTo: ['fine-dining', 'culture', 'France'],
          metadata: {
            duration: 3,
            difficulty: 'easy',
            season: 'year-round'
          }
        },
        {
          type: 'experience' as const,
          title: 'Private cooking class with Michelin chef',
          description: 'Learn from world-renowned chefs in intimate settings',
          reasoning: 'Matches your luxury travel style and culinary interests',
          confidence: 0.88,
          relatedTo: ['fine-dining', 'luxury', 'culture'],
          metadata: {
            duration: 1,
            difficulty: 'moderate'
          }
        }
      ];

      // Mock recommendations response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockRecommendations
        })
      });

      const recommendations = await RecommendationApi.generateRecommendations(userProfile, travelInput);
      expect(recommendations).toHaveLength(2);
      expect(recommendations[0].title).toBe('Lyon, France');
      expect(recommendations[0].confidence).toBe(0.92);
      expect(recommendations[1].type).toBe('experience');
    });

    test('Handles recommendation API errors with detailed error information', async () => {
      const userProfile: UserProfile = {
        id: testUserId,
        homeLocation: {
          city: 'Test City',
          country: 'Test Country',
          coordinates: { lat: 0, lng: 0 }
        },
        preferences: {},
        bucketList: []
      };

      const travelInput: TravelInputData = {
        destinations: [],
        experiences: []
      };

      // Mock API error with detailed response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({
          'content-type': 'application/json'
        }),
        json: async () => ({
          success: false,
          error: {
            message: 'AI service temporarily unavailable',
            code: 'AI_SERVICE_ERROR',
            details: {
              service: 'OpenAI',
              statusCode: 503,
              retryAfter: 60
            }
          }
        })
      });

      try {
        await RecommendationApi.generateRecommendations(userProfile, travelInput);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBe('AI service temporarily unavailable');
        expect(error.statusCode).toBe(500);
        expect(error.apiErrorCode).toBe('AI_SERVICE_ERROR');
        expect(error.details).toBeDefined();
        expect(error.details.service).toBe('RecommendationApi.generateRecommendations');
      }
    });

    test('Generates and integrates follow-up questions', async () => {
      const userProfile: UserProfile = {
        id: testUserId,
        homeLocation: {
          city: 'Seattle',
          country: 'United States',
          coordinates: { lat: 47.6062, lng: -122.3321 }
        },
        preferences: {
          interests: ['nature', 'hiking']
        },
        bucketList: []
      };

      const travelInput: TravelInputData = {
        destinations: ['Pacific Northwest'],
        experiences: ['outdoor activities']
      };

      // Mock follow-up questions generation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            {
              id: 'hiking-difficulty',
              question: 'What difficulty level of hiking do you prefer?',
              type: 'single-choice',
              options: ['Easy trails', 'Moderate hikes', 'Challenging climbs'],
              context: 'experience-refinement'
            }
          ]
        })
      });

      const followUpQuestions = await RecommendationApi.generateFollowUpQuestions(travelInput, userProfile);
      expect(followUpQuestions).toHaveLength(1);
      expect(followUpQuestions[0].question).toContain('hiking');

      // Mock integration of answers
      const answers = { 'hiking-difficulty': 'Moderate hikes' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            updatedInput: {
              ...travelInput,
              experiences: ['moderate hiking', 'scenic trails']
            },
            recommendations: [
              {
                type: 'destination',
                title: 'Mount Rainier National Park',
                description: 'Perfect for moderate hiking with stunning views',
                reasoning: 'Matches your preference for moderate hiking difficulty',
                confidence: 0.85,
                relatedTo: ['hiking', 'nature', 'moderate-difficulty']
              }
            ]
          }
        })
      });

      const integrationResult = await RecommendationApi.integrateFollowUpAnswers(
        travelInput,
        answers,
        userProfile
      );

      expect(integrationResult.updatedInput.experiences).toContain('moderate hiking');
      expect(integrationResult.recommendations).toHaveLength(1);
      expect(integrationResult.recommendations[0].title).toBe('Mount Rainier National Park');
    });
  });

  describe('API Error Handling and Recovery', () => {
    test('Handles network failures gracefully', async () => {
      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(locationApi.validateLocation('Test Location')).rejects.toThrow('Network error');
    });

    test('Handles timeout scenarios', async () => {
      // Mock timeout
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(locationApi.validateLocation('Test Location')).rejects.toThrow('Request timeout');
    });

    test('Handles malformed API responses', async () => {
      // Mock malformed response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      await expect(locationApi.validateLocation('Test Location')).rejects.toThrow();
    });

    test('API health check works correctly', async () => {
      // Mock healthy API
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'ok',
          timestamp: new Date().toISOString()
        })
      });

      const isHealthy = await RecommendationApi.healthCheck();
      expect(isHealthy).toBe(true);

      // Mock unhealthy API
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503
      });

      const isUnhealthy = await RecommendationApi.healthCheck();
      expect(isUnhealthy).toBe(false);
    });
  });

  describe('API Performance and Load Testing', () => {
    test('Handles concurrent API requests', async () => {
      const concurrentRequests = 5;
      const promises = [];

      // Mock successful responses for all requests
      for (let i = 0; i < concurrentRequests; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              isValid: true,
              normalizedLocation: `Location ${i}`,
              confidence: 0.9
            }
          })
        });
      }

      // Make concurrent requests
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(locationApi.validateLocation(`Location ${i}`));
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(concurrentRequests);
      results.forEach((result, index) => {
        expect(result.isValid).toBe(true);
        expect(result.normalizedLocation).toBe(`Location ${index}`);
      });
    });

    test('Measures API response times', async () => {
      const startTime = Date.now();

      // Mock response with delay
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: { isValid: true, normalizedLocation: 'Test Location' }
            })
          }), 100)
        )
      );

      await locationApi.validateLocation('Test Location');
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should complete within reasonable time
      expect(responseTime).toBeGreaterThan(90); // At least the mocked delay
      expect(responseTime).toBeLessThan(200); // But not too much overhead
    });
  });
});