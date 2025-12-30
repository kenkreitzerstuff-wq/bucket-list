import * as fc from 'fast-check';
import { TripPlanner } from '../services/TripPlanner';
import { TravelPreferences, LocationData } from '../types';

/**
 * Property-based tests for TripPlanner
 * Feature: travel-bucket-list
 */

describe('TripPlanner Property Tests', () => {
  let tripPlanner: TripPlanner;

  beforeEach(() => {
    tripPlanner = new TripPlanner();
  });

  // Test data generators
  const locationDataArb = fc.record({
    city: fc.string({ minLength: 2, maxLength: 50 }),
    country: fc.string({ minLength: 2, maxLength: 50 }),
    coordinates: fc.record({
      lat: fc.float({ min: -90, max: 90 }),
      lng: fc.float({ min: -180, max: 180 })
    }),
    airportCode: fc.option(fc.string({ minLength: 3, maxLength: 3 }))
  });

  const travelPreferencesArb = fc.record({
    budgetRange: fc.record({
      min: fc.integer({ min: 500, max: 5000 }),
      max: fc.integer({ min: 5000, max: 50000 }),
      currency: fc.constant('USD')
    }),
    travelStyle: fc.constantFrom('budget', 'mid-range', 'luxury', 'adventure') as fc.Arbitrary<'budget' | 'mid-range' | 'luxury' | 'adventure'>,
    interests: fc.array(fc.constantFrom(
      'museum', 'historical site', 'cultural tour', 'local festival', 'art gallery', 'architecture',
      'hiking', 'trekking', 'climbing', 'safari', 'diving', 'snorkeling', 'skiing', 'surfing',
      'food tour', 'cooking class', 'wine tasting', 'shopping', 'nightlife', 'spa',
      'beach', 'national park', 'wildlife', 'scenic drive', 'boat tour'
    ), { minLength: 1, maxLength: 8 }),
    travelDuration: fc.constantFrom('short', 'medium', 'long') as fc.Arbitrary<'short' | 'medium' | 'long'>,
    groupSize: fc.integer({ min: 1, max: 8 }),
    accessibility: fc.option(fc.array(fc.string(), { maxLength: 3 }), { nil: undefined }),
    homeLocation: fc.option(locationDataArb, { nil: undefined })
  });

  const destinationsArb = fc.array(fc.constantFrom(
    'Paris, France', 'Tokyo, Japan', 'New York, USA', 'London, UK', 'Rome, Italy',
    'Barcelona, Spain', 'Bangkok, Thailand', 'Reykjavik, Iceland', 'Lima, Peru',
    'Auckland, New Zealand', 'Marrakech, Morocco', 'Cairo, Egypt', 'Sydney, Australia',
    'Berlin, Germany', 'Seoul, South Korea', 'Mumbai, India', 'Toronto, Canada'
  ), { minLength: 1, maxLength: 5 });

  /**
   * Property 9: Duration Calculation Logic
   * Feature: travel-bucket-list, Property 9: Duration Calculation Logic
   * Validates: Requirements 5.1, 5.2
   */
  test('Property 9: Duration Calculation Logic - duration should increase with number and complexity of experiences', async () => {
    await fc.assert(
      fc.asyncProperty(
        destinationsArb,
        travelPreferencesArb,
        async (destinations: string[], preferences: TravelPreferences) => {
          const tripPlan = await tripPlanner.planTrip(destinations, preferences);
          
          // Verify basic structure
          expect(tripPlan).toBeDefined();
          expect(tripPlan.destinations).toBeDefined();
          expect(Array.isArray(tripPlan.destinations)).toBe(true);
          expect(tripPlan.destinations.length).toBe(destinations.length);
          expect(tripPlan.totalDuration).toBeGreaterThan(0);
          expect(typeof tripPlan.totalDuration).toBe('number');
          
          // Verify duration increases with number of destinations
          if (destinations.length > 1) {
            expect(tripPlan.totalDuration).toBeGreaterThan(3); // More than minimum single destination
          }
          
          // Verify each destination has reasonable duration
          tripPlan.destinations.forEach((destPlan) => {
            expect(destPlan.suggestedDuration).toBeGreaterThanOrEqual(3); // Minimum base duration
            expect(destPlan.suggestedDuration).toBeLessThanOrEqual(30); // Reasonable maximum
            expect(typeof destPlan.suggestedDuration).toBe('number');
            
            // Duration should correlate with number of experiences
            const experienceCount = destPlan.experiences.length;
            if (experienceCount > 5) {
              expect(destPlan.suggestedDuration).toBeGreaterThan(5); // More experiences = more time
            }
          });
          
          // Verify total duration is sum of destination durations plus travel buffer
          const destinationDaysSum = tripPlan.destinations.reduce(
            (sum, dest) => sum + dest.suggestedDuration, 
            0
          );
          const expectedTravelBuffer = destinations.length > 1 ? destinations.length - 1 : 0;
          const expectedTotal = destinationDaysSum + expectedTravelBuffer;
          
          expect(tripPlan.totalDuration).toBe(expectedTotal);
          
          // Verify duration consistency across multiple calls with same input
          const secondTripPlan = await tripPlanner.planTrip(destinations, preferences);
          expect(secondTripPlan.totalDuration).toBe(tripPlan.totalDuration);
          
          // Verify experiences influence duration calculation
          const experienceTypes = preferences.interests || [];
          const hasComplexExperiences = experienceTypes.some(exp => 
            ['trekking', 'safari', 'climbing'].includes(exp)
          );
          const hasSimpleExperiences = experienceTypes.some(exp => 
            ['museum', 'art gallery', 'food tour'].includes(exp)
          );
          
          if (hasComplexExperiences && !hasSimpleExperiences) {
            // Complex experiences should result in longer durations
            const avgDuration = tripPlan.destinations.reduce(
              (sum, dest) => sum + dest.suggestedDuration, 0
            ) / tripPlan.destinations.length;
            expect(avgDuration).toBeGreaterThan(4);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test for route optimization
   */
  test('Route optimization should maintain all destinations', async () => {
    await fc.assert(
      fc.asyncProperty(
        destinationsArb,
        locationDataArb,
        async (destinations: string[], homeLocation: LocationData) => {
          const optimizedRoute = await tripPlanner.optimizeRoute(destinations, homeLocation);
          
          // Verify all destinations are preserved
          expect(optimizedRoute.length).toBe(destinations.length);
          
          // Verify no destinations are lost
          destinations.forEach(dest => {
            expect(optimizedRoute).toContain(dest);
          });
          
          // Verify no duplicates
          const uniqueDestinations = new Set(optimizedRoute);
          expect(uniqueDestinations.size).toBe(destinations.length);
          
          // For single destination, route should be unchanged
          if (destinations.length === 1) {
            expect(optimizedRoute).toEqual(destinations);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property test for travel time calculations
   */
  test('Travel times should be positive and reasonable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.constantFrom(
          'Paris, France', 'Tokyo, Japan', 'New York, USA', 'London, UK'
        ), { minLength: 2, maxLength: 4 }),
        travelPreferencesArb,
        async (destinations: string[], preferences: TravelPreferences) => {
          const tripPlan = await tripPlanner.planTrip(destinations, preferences);
          
          // Verify travel times structure
          expect(tripPlan.travelTimes).toBeDefined();
          expect(typeof tripPlan.travelTimes).toBe('object');
          
          // Verify travel times for consecutive destinations
          for (let i = 0; i < destinations.length - 1; i++) {
            const from = destinations[i];
            const to = destinations[i + 1];
            const key = `${from}-${to}`;
            
            expect(tripPlan.travelTimes[key]).toBeDefined();
            expect(typeof tripPlan.travelTimes[key]).toBe('number');
            expect(tripPlan.travelTimes[key]).toBeGreaterThan(0);
            expect(tripPlan.travelTimes[key]).toBeLessThanOrEqual(24); // Max 24 hours travel time
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property test for cost aggregation
   */
  test('Total costs should be sum of all destination costs', async () => {
    await fc.assert(
      fc.asyncProperty(
        destinationsArb,
        travelPreferencesArb,
        async (destinations: string[], preferences: TravelPreferences) => {
          const tripPlan = await tripPlanner.planTrip(destinations, preferences);
          
          // Verify cost structure
          expect(tripPlan.totalCost).toBeDefined();
          expect(tripPlan.totalCost.transportation).toBeDefined();
          expect(tripPlan.totalCost.accommodation).toBeDefined();
          expect(tripPlan.totalCost.activities).toBeDefined();
          expect(tripPlan.totalCost.food).toBeDefined();
          expect(tripPlan.totalCost.total).toBeDefined();
          
          // Verify cost ranges are valid
          expect(tripPlan.totalCost.transportation.min).toBeGreaterThanOrEqual(0);
          expect(tripPlan.totalCost.transportation.max).toBeGreaterThan(tripPlan.totalCost.transportation.min);
          expect(tripPlan.totalCost.accommodation.min).toBeGreaterThanOrEqual(0);
          expect(tripPlan.totalCost.accommodation.max).toBeGreaterThan(tripPlan.totalCost.accommodation.min);
          expect(tripPlan.totalCost.activities.min).toBeGreaterThanOrEqual(0);
          expect(tripPlan.totalCost.activities.max).toBeGreaterThan(tripPlan.totalCost.activities.min);
          expect(tripPlan.totalCost.food.min).toBeGreaterThanOrEqual(0);
          expect(tripPlan.totalCost.food.max).toBeGreaterThan(tripPlan.totalCost.food.min);
          
          // Verify total is sum of components
          const expectedMinTotal = tripPlan.totalCost.transportation.min + 
                                  tripPlan.totalCost.accommodation.min + 
                                  tripPlan.totalCost.activities.min + 
                                  tripPlan.totalCost.food.min;
          const expectedMaxTotal = tripPlan.totalCost.transportation.max + 
                                  tripPlan.totalCost.accommodation.max + 
                                  tripPlan.totalCost.activities.max + 
                                  tripPlan.totalCost.food.max;
          
          expect(tripPlan.totalCost.total.min).toBe(expectedMinTotal);
          expect(tripPlan.totalCost.total.max).toBe(expectedMaxTotal);
          
          // Verify costs increase with more destinations
          if (destinations.length > 1) {
            expect(tripPlan.totalCost.total.min).toBeGreaterThan(500); // Multi-destination should be more expensive
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});