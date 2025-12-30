import { describe, test, expect, beforeEach } from 'vitest';
import { LocationService, UserProfileStorage } from '../../../backend/src/services/LocationService';
import { TravelInputService } from '../../../backend/src/services/TravelInputService';
import { TravelInputData } from '../types';

/**
 * Integration tests for the basic input system
 * Validates that the complete workflow from home location to travel input works correctly
 */
describe('Basic Input System Integration Tests', () => {
  const testUserId = 'test-user-integration';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  test('Complete workflow: Home location → Travel input → Storage → Retrieval', async () => {
    // Step 1: Set home location
    const homeLocationInput = 'New York, United States';
    const locationValidation = LocationService.validateLocation(homeLocationInput);
    expect(locationValidation.isValid).toBe(true);

    const locationData = await LocationService.parseLocationData(homeLocationInput);
    expect(locationData.city).toBe('New York');
    expect(locationData.country).toBe('United States');

    UserProfileStorage.storeHomeLocation(testUserId, locationData);

    // Verify home location is stored
    const retrievedLocation = UserProfileStorage.getHomeLocation(testUserId);
    expect(retrievedLocation).toEqual(locationData);

    // Step 2: Create travel input
    const travelInput: TravelInputData = {
      destinations: ['Paris, France', 'Tokyo, Japan', 'Sydney, Australia'],
      experiences: ['Visit museums', 'Try local cuisine', 'Explore historic sites'],
      preferences: {
        budgetRange: { min: 2000, max: 8000, currency: 'USD' },
        travelStyle: 'mid-range',
        interests: ['culture', 'food', 'history'],
        travelDuration: 'medium',
        groupSize: 2
      },
      timeframe: {
        flexibility: 'flexible'
      }
    };

    // Step 3: Validate travel input
    const validation = TravelInputService.validateTravelInput(travelInput);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    // Step 4: Check completeness
    const completenessScore = TravelInputService.calculateCompletenessScore(travelInput);
    expect(completenessScore).toBeGreaterThan(70); // Should be quite complete

    // Step 5: Store travel input
    TravelInputService.storeTravelInput(testUserId, travelInput);

    // Step 6: Retrieve and verify
    const retrievedTravelInput = TravelInputService.getTravelInput(testUserId);
    expect(retrievedTravelInput).toBeDefined();
    expect(retrievedTravelInput!.destinations).toEqual(travelInput.destinations);
    expect(retrievedTravelInput!.experiences).toEqual(travelInput.experiences);
    expect(retrievedTravelInput!.preferences).toEqual(travelInput.preferences);

    // Step 7: Verify user profile contains both home location and travel input
    const userProfile = UserProfileStorage.getUserProfile(testUserId);
    expect(userProfile.homeLocation).toEqual(locationData);
    expect(userProfile.travelInput).toBeDefined();
  });

  test('Incomplete input detection and follow-up generation', () => {
    // Create incomplete/vague travel input
    const incompleteInput: TravelInputData = {
      destinations: ['Europe', 'Asia'], // Vague destinations
      experiences: ['adventure', 'fun'], // Vague experiences
      preferences: undefined, // Missing preferences
      timeframe: undefined // Missing timeframe
    };

    // Validate - should be invalid due to missing preferences
    const validation = TravelInputService.validateTravelInput(incompleteInput);
    expect(validation.isValid).toBe(false);

    // Should detect incompleteness
    const incompleteAnalysis = TravelInputService.detectIncompleteInput(incompleteInput);
    expect(incompleteAnalysis.needsFollowUp).toBe(true);
    expect(incompleteAnalysis.incompleteAreas.length).toBeGreaterThan(0);
    expect(incompleteAnalysis.suggestions.length).toBeGreaterThan(0);

    // Should generate follow-up questions
    const questions = TravelInputService.generateFollowUpQuestions(incompleteInput);
    expect(questions.length).toBeGreaterThan(0);

    // Questions should address the vague input
    const destinationQuestions = questions.filter(q => 
      q.context.toLowerCase().includes('destination') ||
      q.question.toLowerCase().includes('europe') ||
      q.question.toLowerCase().includes('asia')
    );
    expect(destinationQuestions.length).toBeGreaterThan(0);

    // Completeness score should be low
    const completenessScore = TravelInputService.calculateCompletenessScore(incompleteInput);
    expect(completenessScore).toBeLessThan(50);
  });

  test('Input normalization preserves essential data', () => {
    // Create input with whitespace and formatting issues
    const messyInput: TravelInputData = {
      destinations: ['  paris, france  ', '  TOKYO, JAPAN  ', '  sydney,australia'],
      experiences: ['  visit museums  ', '  TRY LOCAL FOOD  ', '  explore sites  '],
      preferences: {
        budgetRange: { min: 1000, max: 5000, currency: 'USD' },
        travelStyle: 'budget',
        interests: ['  culture  ', '  FOOD  ', '  history  '],
        travelDuration: 'short',
        groupSize: 1
      }
    };

    // Normalize the input
    const normalized = TravelInputService.normalizeTravelInput(messyInput);

    // Should preserve all items but clean them up
    expect(normalized.destinations).toHaveLength(3);
    expect(normalized.experiences).toHaveLength(3);
    expect(normalized.preferences?.interests).toHaveLength(3);

    // Should be properly trimmed
    normalized.destinations.forEach(dest => {
      expect(dest).toBe(dest.trim());
      expect(dest.length).toBeGreaterThan(0);
    });

    normalized.experiences.forEach(exp => {
      expect(exp).toBe(exp.trim());
      expect(exp.length).toBeGreaterThan(0);
    });

    normalized.preferences?.interests?.forEach(interest => {
      expect(interest).toBe(interest.trim());
    });

    // Normalized input should be valid
    const validation = TravelInputService.validateTravelInput(normalized);
    expect(validation.isValid).toBe(true);
  });

  test('Multiple users have isolated data', async () => {
    const user1Id = 'user1-test';
    const user2Id = 'user2-test';

    // Set different home locations
    const location1 = await LocationService.parseLocationData('London, UK');
    const location2 = await LocationService.parseLocationData('Tokyo, Japan');

    UserProfileStorage.storeHomeLocation(user1Id, location1);
    UserProfileStorage.storeHomeLocation(user2Id, location2);

    // Set different travel inputs
    const travelInput1: TravelInputData = {
      destinations: ['Paris', 'Rome'],
      experiences: ['Museums', 'Food tours']
    };

    const travelInput2: TravelInputData = {
      destinations: ['Bangkok', 'Seoul'],
      experiences: ['Street food', 'Temples']
    };

    TravelInputService.storeTravelInput(user1Id, travelInput1);
    TravelInputService.storeTravelInput(user2Id, travelInput2);

    // Verify isolation
    const retrievedLocation1 = UserProfileStorage.getHomeLocation(user1Id);
    const retrievedLocation2 = UserProfileStorage.getHomeLocation(user2Id);
    const retrievedInput1 = TravelInputService.getTravelInput(user1Id);
    const retrievedInput2 = TravelInputService.getTravelInput(user2Id);

    expect(retrievedLocation1).toEqual(location1);
    expect(retrievedLocation2).toEqual(location2);
    expect(retrievedInput1?.destinations).toEqual(travelInput1.destinations);
    expect(retrievedInput2?.destinations).toEqual(travelInput2.destinations);

    // Should not be equal to each other
    expect(retrievedLocation1).not.toEqual(retrievedLocation2);
    expect(retrievedInput1).not.toEqual(retrievedInput2);
  });

  test('System handles edge cases gracefully', () => {
    // Test empty input
    const emptyInput: TravelInputData = {
      destinations: [],
      experiences: []
    };

    const emptyValidation = TravelInputService.validateTravelInput(emptyInput);
    expect(emptyValidation.isValid).toBe(false);
    expect(emptyValidation.errors.length).toBeGreaterThan(0);

    // Test single character input
    const tinyInput: TravelInputData = {
      destinations: ['a'],
      experiences: ['b']
    };

    const tinyValidation = TravelInputService.validateTravelInput(tinyInput);
    expect(tinyValidation.isValid).toBe(false);

    // Test very long input
    const longDestination = 'a'.repeat(200);
    const longInput: TravelInputData = {
      destinations: [longDestination],
      experiences: ['normal experience']
    };

    // Should handle long input without crashing
    expect(() => {
      TravelInputService.validateTravelInput(longInput);
      TravelInputService.calculateCompletenessScore(longInput);
      TravelInputService.detectIncompleteInput(longInput);
    }).not.toThrow();
  });

  test('Budget validation works correctly', () => {
    // Valid budget
    const validBudgetInput: TravelInputData = {
      destinations: ['Paris'],
      experiences: ['Museums'],
      preferences: {
        budgetRange: { min: 1000, max: 5000, currency: 'USD' },
        travelStyle: 'mid-range',
        interests: ['culture'],
        travelDuration: 'short',
        groupSize: 2
      }
    };

    const validValidation = TravelInputService.validateTravelInput(validBudgetInput);
    expect(validValidation.isValid).toBe(true);

    // Invalid budget - min >= max
    const invalidBudgetInput: TravelInputData = {
      destinations: ['Paris'],
      experiences: ['Museums'],
      preferences: {
        budgetRange: { min: 5000, max: 1000, currency: 'USD' },
        travelStyle: 'mid-range',
        interests: ['culture'],
        travelDuration: 'short',
        groupSize: 2
      }
    };

    const invalidValidation = TravelInputService.validateTravelInput(invalidBudgetInput);
    expect(invalidValidation.isValid).toBe(false);
    expect(invalidValidation.errors.some(e => e.toLowerCase().includes('budget'))).toBe(true);

    // Negative budget
    const negativeBudgetInput: TravelInputData = {
      destinations: ['Paris'],
      experiences: ['Museums'],
      preferences: {
        budgetRange: { min: -1000, max: 5000, currency: 'USD' },
        travelStyle: 'mid-range',
        interests: ['culture'],
        travelDuration: 'short',
        groupSize: 2
      }
    };

    const negativeValidation = TravelInputService.validateTravelInput(negativeBudgetInput);
    expect(negativeValidation.isValid).toBe(false);
    expect(negativeValidation.errors.some(e => e.toLowerCase().includes('positive'))).toBe(true);
  });
});

// Mock localStorage for Node.js environment
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});