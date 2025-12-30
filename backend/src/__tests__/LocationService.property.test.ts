import * as fc from 'fast-check';
import { LocationService, UserProfileStorage } from '../services/LocationService';

/**
 * Property-based tests for LocationService
 * Feature: travel-bucket-list, Property 7: Location Validation and Storage
 * **Validates: Requirements 4.2, 4.5**
 */
describe('LocationService Property Tests', () => {
  
  /**
   * Property 7: Location Validation and Storage
   * For any valid location input (city/country, airport code, postal code), 
   * the system should validate, normalize, and store the location data correctly
   */
  test('Property 7: Location Validation and Storage', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Generate valid city/country combinations
          fc.record({
            city: fc.string({ minLength: 2, maxLength: 50 }).filter(s => /^[a-zA-Z\s-']+$/.test(s)),
            country: fc.string({ minLength: 2, maxLength: 50 }).filter(s => /^[a-zA-Z\s-']+$/.test(s))
          }).map(({ city, country }) => `${city}, ${country}`),
          
          // Generate valid airport codes
          fc.string({ minLength: 3, maxLength: 3 }).filter(s => /^[A-Z]{3}$/.test(s)),
          
          // Generate valid US postal codes
          fc.integer({ min: 10000, max: 99999 }).map(n => n.toString()),
          
          // Generate valid single city names
          fc.string({ minLength: 2, maxLength: 30 }).filter(s => /^[a-zA-Z\s-']+$/.test(s))
        ),
        (validLocation) => {
          // Test validation
          const validation = LocationService.validateLocation(validLocation);
          expect(validation.isValid).toBe(true);
          expect(validation.errors).toHaveLength(0);
          
          // Test normalization
          const normalized = LocationService.normalizeLocation(validLocation);
          expect(normalized).toBeDefined();
          expect(normalized.length).toBeGreaterThan(0);
          
          // Note: Async parsing test moved to separate test
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Invalid location inputs should be consistently rejected
   */
  test('Property: Invalid location inputs are rejected', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Empty or whitespace-only strings
          fc.constant(''),
          fc.constant('   '),
          fc.constant('\t\n'),
          
          // Invalid airport codes
          fc.oneof(
            fc.string({ minLength: 1, maxLength: 2 }).filter(s => /^[A-Z]+$/.test(s)),
            fc.string({ minLength: 4, maxLength: 10 }).filter(s => /^[A-Z]+$/.test(s)),
            fc.string({ minLength: 3, maxLength: 3 }).filter(s => /^[a-z]{3}$/.test(s))
          ),
          
          // Single character inputs
          fc.char(),
          
          // Invalid characters
          fc.string().filter(s => s.includes('@') || s.includes('#') || s.includes('$'))
        ),
        (invalidLocation) => {
          const validation = LocationService.validateLocation(invalidLocation);
          expect(validation.isValid).toBe(false);
          expect(validation.errors.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Normalization should be idempotent
   * Normalizing a normalized location should return the same result
   */
  test('Property: Normalization is idempotent', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({
            city: fc.string({ minLength: 2, maxLength: 30 }).filter(s => /^[a-zA-Z\s-']+$/.test(s)),
            country: fc.string({ minLength: 2, maxLength: 30 }).filter(s => /^[a-zA-Z\s-']+$/.test(s))
          }).map(({ city, country }) => `${city}, ${country}`),
          fc.string({ minLength: 3, maxLength: 3 }).filter(s => /^[A-Z]{3}$/.test(s))
        ),
        (location) => {
          const normalized1 = LocationService.normalizeLocation(location);
          const normalized2 = LocationService.normalizeLocation(normalized1);
          expect(normalized1).toBe(normalized2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property-based tests for UserProfileStorage
 * Feature: travel-bucket-list, Property 7: Location Validation and Storage
 */
describe('UserProfileStorage Property Tests', () => {
  
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  /**
   * Property: Storage and retrieval should be consistent
   * Any location data stored should be retrievable unchanged
   */
  test('Property: Location storage and retrieval consistency', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // userId
        fc.record({
          city: fc.string({ minLength: 1, maxLength: 50 }),
          country: fc.string({ minLength: 1, maxLength: 50 }),
          coordinates: fc.record({
            lat: fc.float({ min: -90, max: 90 }),
            lng: fc.float({ min: -180, max: 180 })
          }),
          airportCode: fc.option(fc.string({ minLength: 3, maxLength: 3 }))
        }),
        (userId, locationData) => {
          // Store the location
          UserProfileStorage.storeHomeLocation(userId, locationData);
          
          // Retrieve the location
          const retrieved = UserProfileStorage.getHomeLocation(userId);
          
          // Should match exactly
          expect(retrieved).toEqual(locationData);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Multiple users should have isolated storage
   */
  test('Property: User storage isolation', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }), // userId1
        fc.string({ minLength: 1, maxLength: 20 }), // userId2
        fc.record({
          city: fc.string({ minLength: 1, maxLength: 30 }),
          country: fc.string({ minLength: 1, maxLength: 30 }),
          coordinates: fc.record({
            lat: fc.float({ min: -90, max: 90 }),
            lng: fc.float({ min: -180, max: 180 })
          })
        }), // location1
        fc.record({
          city: fc.string({ minLength: 1, maxLength: 30 }),
          country: fc.string({ minLength: 1, maxLength: 30 }),
          coordinates: fc.record({
            lat: fc.float({ min: -90, max: 90 }),
            lng: fc.float({ min: -180, max: 180 })
          })
        }), // location2
        (userId1, userId2, location1, location2) => {
          // Skip if userIds are the same
          fc.pre(userId1 !== userId2);
          
          // Store different locations for different users
          UserProfileStorage.storeHomeLocation(userId1, location1);
          UserProfileStorage.storeHomeLocation(userId2, location2);
          
          // Each user should get their own location back
          const retrieved1 = UserProfileStorage.getHomeLocation(userId1);
          const retrieved2 = UserProfileStorage.getHomeLocation(userId2);
          
          expect(retrieved1).toEqual(location1);
          expect(retrieved2).toEqual(location2);
          
          // Locations should be different (unless they happen to be the same)
          if (JSON.stringify(location1) !== JSON.stringify(location2)) {
            expect(retrieved1).not.toEqual(retrieved2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Clearing user profile should remove home location
   */
  test('Property: Profile clearing removes home location', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // userId
        fc.record({
          city: fc.string({ minLength: 1, maxLength: 50 }),
          country: fc.string({ minLength: 1, maxLength: 50 }),
          coordinates: fc.record({
            lat: fc.float({ min: -90, max: 90 }),
            lng: fc.float({ min: -180, max: 180 })
          })
        }),
        (userId, locationData) => {
          // Store the location
          UserProfileStorage.storeHomeLocation(userId, locationData);
          
          // Verify it's stored
          expect(UserProfileStorage.getHomeLocation(userId)).toEqual(locationData);
          
          // Clear the profile
          UserProfileStorage.clearUserProfile(userId);
          
          // Location should be null after clearing
          expect(UserProfileStorage.getHomeLocation(userId)).toBeNull();
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