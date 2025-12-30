import * as fc from 'fast-check';
import { TravelInputService } from '../services/TravelInputService';
import { TravelInputData, TravelPreferences } from '../types';

/**
 * Property-based tests for TravelInputService
 * Feature: travel-bucket-list, Property 1: Input Storage Consistency
 * **Validates: Requirements 1.2, 1.3**
 */
describe('TravelInputService Property Tests', () => {

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  /**
   * Property 1: Input Storage Consistency
   * For any valid destination or experience input, storing the input should result 
   * in the data being retrievable from the user's profile
   */
  test('Property 1: Input Storage Consistency', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // userId
        fc.record({
          destinations: fc.array(
            fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
            { minLength: 1, maxLength: 10 }
          ),
          experiences: fc.array(
            fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
            { minLength: 1, maxLength: 10 }
          ),
          preferences: fc.option(fc.record({
            budgetRange: fc.record({
              min: fc.integer({ min: 100, max: 10000 }),
              max: fc.integer({ min: 1000, max: 50000 }),
              currency: fc.constant('USD')
            }),
            travelStyle: fc.constantFrom('budget', 'mid-range', 'luxury', 'adventure') as fc.Arbitrary<'budget' | 'mid-range' | 'luxury' | 'adventure'>,
            interests: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 10 }),
            travelDuration: fc.constantFrom('short', 'medium', 'long') as fc.Arbitrary<'short' | 'medium' | 'long'>,
            groupSize: fc.integer({ min: 1, max: 20 })
          }), { nil: undefined }),
          timeframe: fc.option(fc.record({
            startDate: fc.option(fc.date(), { nil: undefined }),
            endDate: fc.option(fc.date(), { nil: undefined }),
            flexibility: fc.constantFrom('fixed', 'flexible', 'very-flexible') as fc.Arbitrary<'fixed' | 'flexible' | 'very-flexible'>
          }), { nil: undefined })
        }),
        (userId, travelInputData) => {
          // Ensure budget range is valid
          if (travelInputData.preferences?.budgetRange) {
            fc.pre(travelInputData.preferences.budgetRange.min < travelInputData.preferences.budgetRange.max);
          }

          // Store the travel input
          TravelInputService.storeTravelInput(userId, travelInputData);
          
          // Retrieve the travel input
          const retrieved = TravelInputService.getTravelInput(userId);
          
          // Should match the stored data
          expect(retrieved).toBeDefined();
          expect(retrieved!.destinations).toEqual(travelInputData.destinations);
          expect(retrieved!.experiences).toEqual(travelInputData.experiences);
          
          if (travelInputData.preferences) {
            expect(retrieved!.preferences).toEqual(travelInputData.preferences);
          }
          
          if (travelInputData.timeframe) {
            expect(retrieved!.timeframe).toBeDefined();
            expect(retrieved!.timeframe!.flexibility).toEqual(travelInputData.timeframe.flexibility);
            
            // Handle date serialization - localStorage converts dates to strings
            if (travelInputData.timeframe.startDate) {
              expect(retrieved!.timeframe!.startDate).toEqual(travelInputData.timeframe.startDate.toISOString());
            } else {
              expect(retrieved!.timeframe!.startDate).toBeUndefined();
            }
            
            if (travelInputData.timeframe.endDate) {
              expect(retrieved!.timeframe!.endDate).toEqual(travelInputData.timeframe.endDate.toISOString());
            } else {
              expect(retrieved!.timeframe!.endDate).toBeUndefined();
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Multiple users should have isolated travel input storage
   */
  test('Property: User travel input isolation', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }), // userId1
        fc.string({ minLength: 1, maxLength: 20 }), // userId2
        fc.record({
          destinations: fc.array(fc.string({ minLength: 2, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
          experiences: fc.array(fc.string({ minLength: 2, maxLength: 50 }), { minLength: 1, maxLength: 5 })
        }), // travelInput1
        fc.record({
          destinations: fc.array(fc.string({ minLength: 2, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
          experiences: fc.array(fc.string({ minLength: 2, maxLength: 50 }), { minLength: 1, maxLength: 5 })
        }), // travelInput2
        (userId1, userId2, travelInput1, travelInput2) => {
          // Skip if userIds are the same
          fc.pre(userId1 !== userId2);
          
          // Store different travel inputs for different users
          TravelInputService.storeTravelInput(userId1, travelInput1);
          TravelInputService.storeTravelInput(userId2, travelInput2);
          
          // Each user should get their own travel input back
          const retrieved1 = TravelInputService.getTravelInput(userId1);
          const retrieved2 = TravelInputService.getTravelInput(userId2);
          
          expect(retrieved1).toBeDefined();
          expect(retrieved2).toBeDefined();
          expect(retrieved1!.destinations).toEqual(travelInput1.destinations);
          expect(retrieved1!.experiences).toEqual(travelInput1.experiences);
          expect(retrieved2!.destinations).toEqual(travelInput2.destinations);
          expect(retrieved2!.experiences).toEqual(travelInput2.experiences);
          
          // Travel inputs should be different (unless they happen to be the same)
          if (JSON.stringify(travelInput1) !== JSON.stringify(travelInput2)) {
            expect(retrieved1).not.toEqual(retrieved2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Normalization should preserve essential data
   */
  test('Property: Normalization preserves essential data', () => {
    fc.assert(
      fc.property(
        fc.record({
          destinations: fc.array(
            fc.string({ minLength: 2, maxLength: 50 }).map(s => `  ${s}  `), // Add whitespace
            { minLength: 1, maxLength: 5 }
          ),
          experiences: fc.array(
            fc.string({ minLength: 2, maxLength: 50 }).map(s => `  ${s}  `), // Add whitespace
            { minLength: 1, maxLength: 5 }
          ),
          preferences: fc.option(fc.record({
            interests: fc.array(
              fc.string({ minLength: 1, maxLength: 20 }).map(s => `  ${s}  `), // Add whitespace
              { maxLength: 5 }
            )
          }), { nil: undefined })
        }),
        (travelInput) => {
          const normalized = TravelInputService.normalizeTravelInput(travelInput);
          
          // Should have same number of destinations and experiences
          expect(normalized.destinations.length).toBe(travelInput.destinations.length);
          expect(normalized.experiences.length).toBe(travelInput.experiences.length);
          
          // All destinations and experiences should be trimmed
          normalized.destinations.forEach(dest => {
            expect(dest).toBe(dest.trim());
            expect(dest.length).toBeGreaterThan(0);
          });
          
          normalized.experiences.forEach(exp => {
            expect(exp).toBe(exp.trim());
            expect(exp.length).toBeGreaterThan(0);
          });
          
          // Interests should be trimmed if present
          if (normalized.preferences?.interests) {
            normalized.preferences.interests.forEach(interest => {
              expect(interest).toBe(interest.trim());
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Validation should be consistent for same input
   */
  test('Property: Validation consistency', () => {
    fc.assert(
      fc.property(
        fc.record({
          destinations: fc.array(fc.string({ minLength: 2, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
          experiences: fc.array(fc.string({ minLength: 2, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
          preferences: fc.option(fc.record({
            travelStyle: fc.constantFrom('budget', 'mid-range', 'luxury', 'adventure') as fc.Arbitrary<'budget' | 'mid-range' | 'luxury' | 'adventure'>,
            groupSize: fc.integer({ min: 1, max: 20 }),
            budgetRange: fc.record({
              min: fc.integer({ min: 100, max: 5000 }),
              max: fc.integer({ min: 1000, max: 10000 }),
              currency: fc.constant('USD')
            })
          }), { nil: undefined })
        }),
        (travelInput) => {
          // Ensure budget range is valid if present
          if (travelInput.preferences?.budgetRange) {
            fc.pre(travelInput.preferences.budgetRange.min < travelInput.preferences.budgetRange.max);
          }

          // Multiple validations of the same input should return the same result
          const validation1 = TravelInputService.validateTravelInput(travelInput);
          const validation2 = TravelInputService.validateTravelInput(travelInput);
          const validation3 = TravelInputService.validateTravelInput(travelInput);
          
          expect(validation1.isValid).toBe(validation2.isValid);
          expect(validation2.isValid).toBe(validation3.isValid);
          expect(validation1.errors).toEqual(validation2.errors);
          expect(validation2.errors).toEqual(validation3.errors);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Completeness score should be between 0 and 100
   */
  test('Property: Completeness score bounds', () => {
    fc.assert(
      fc.property(
        fc.record({
          destinations: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }),
          experiences: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }),
          preferences: fc.option(fc.record({
            travelStyle: fc.option(fc.constantFrom('budget', 'mid-range', 'luxury', 'adventure') as fc.Arbitrary<'budget' | 'mid-range' | 'luxury' | 'adventure'>, { nil: undefined }),
            interests: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 10 }), { nil: undefined }),
            groupSize: fc.option(fc.integer({ min: 1, max: 50 }), { nil: undefined }),
            budgetRange: fc.option(fc.record({
              min: fc.integer({ min: 0, max: 10000 }),
              max: fc.integer({ min: 100, max: 50000 }),
              currency: fc.constant('USD')
            }), { nil: undefined })
          }), { nil: undefined }),
          timeframe: fc.option(fc.record({
            flexibility: fc.constantFrom('fixed', 'flexible', 'very-flexible') as fc.Arbitrary<'fixed' | 'flexible' | 'very-flexible'>
          }), { nil: undefined })
        }),
        (travelInput) => {
          const score = TravelInputService.calculateCompletenessScore(travelInput);
          
          // Score should be between 0 and 100
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
          
          // Score should be a whole number
          expect(Number.isInteger(score)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: More complete input should have higher completeness score
   */
  test('Property: Completeness score increases with more data', () => {
    fc.assert(
      fc.property(
        fc.record({
          destinations: fc.array(fc.string({ minLength: 2, maxLength: 30 }), { minLength: 1, maxLength: 3 }),
          experiences: fc.array(fc.string({ minLength: 2, maxLength: 30 }), { minLength: 1, maxLength: 3 })
        }),
        (baseInput) => {
          // Create a more complete version by adding preferences
          const moreCompleteInput: TravelInputData = {
            ...baseInput,
            preferences: {
              travelStyle: 'mid-range',
              interests: ['culture', 'food'],
              groupSize: 2,
              travelDuration: 'medium',
              budgetRange: { min: 1000, max: 5000, currency: 'USD' }
            },
            timeframe: {
              flexibility: 'flexible'
            }
          };
          
          const baseScore = TravelInputService.calculateCompletenessScore(baseInput);
          const completeScore = TravelInputService.calculateCompletenessScore(moreCompleteInput);
          
          // More complete input should have higher score
          expect(completeScore).toBeGreaterThan(baseScore);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Incomplete input detection should be consistent
   */
  test('Property: Incomplete input detection consistency', () => {
    fc.assert(
      fc.property(
        fc.record({
          destinations: fc.array(
            fc.oneof(
              fc.string({ minLength: 2, maxLength: 30 }),
              fc.constantFrom('europe', 'asia', 'world') // Vague destinations
            ),
            { minLength: 1, maxLength: 5 }
          ),
          experiences: fc.array(
            fc.oneof(
              fc.string({ minLength: 5, maxLength: 30 }),
              fc.constantFrom('adventure', 'fun', 'experience') // Vague experiences
            ),
            { minLength: 1, maxLength: 5 }
          )
        }),
        (travelInput) => {
          const analysis1 = TravelInputService.detectIncompleteInput(travelInput);
          const analysis2 = TravelInputService.detectIncompleteInput(travelInput);
          
          // Multiple analyses should return the same result
          expect(analysis1.needsFollowUp).toBe(analysis2.needsFollowUp);
          expect(analysis1.incompleteAreas).toEqual(analysis2.incompleteAreas);
          expect(analysis1.suggestions).toEqual(analysis2.suggestions);
          
          // If there are vague destinations, should need follow-up
          const hasVagueDestinations = travelInput.destinations.some(dest =>
            ['europe', 'asia', 'world'].includes(dest.toLowerCase())
          );
          
          if (hasVagueDestinations) {
            expect(analysis1.needsFollowUp).toBe(true);
            expect(analysis1.incompleteAreas).toContain('destinations');
          }
        }
      ),
      { numRuns: 100 }
    );
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