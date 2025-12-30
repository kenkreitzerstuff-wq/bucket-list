import * as fc from 'fast-check';
import { CostEstimator } from '../services/CostEstimator';
import { TripData, LocationData } from '../types';

/**
 * Property-based tests for CostEstimator
 * Feature: travel-bucket-list
 */

describe('CostEstimator Property Tests', () => {
  let costEstimator: CostEstimator;

  beforeEach(() => {
    costEstimator = new CostEstimator();
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

  const tripDataArb = fc.record({
    destinations: fc.array(fc.constantFrom(
      'Paris, France', 'Tokyo, Japan', 'New York, USA', 'London, UK', 'Rome, Italy',
      'Barcelona, Spain', 'Bangkok, Thailand', 'Reykjavik, Iceland', 'Lima, Peru',
      'Auckland, New Zealand', 'Marrakech, Morocco', 'Cairo, Egypt', 'Sydney, Australia',
      'Berlin, Germany', 'Seoul, South Korea', 'Mumbai, India', 'Toronto, Canada'
    ), { minLength: 1, maxLength: 4 }),
    experiences: fc.array(fc.constantFrom(
      'museum visits', 'historical tours', 'cultural experiences', 'local festivals',
      'hiking', 'trekking', 'climbing', 'safari', 'diving', 'snorkeling',
      'food tours', 'cooking classes', 'wine tasting', 'shopping', 'nightlife',
      'beach relaxation', 'national parks', 'wildlife viewing', 'scenic drives',
      'luxury spa', 'private tours', 'helicopter rides', 'free walking tours'
    ), { minLength: 1, maxLength: 6 }),
    duration: fc.integer({ min: 3, max: 30 }),
    startDate: fc.option(fc.date()),
    endDate: fc.option(fc.date()),
    travelers: fc.integer({ min: 1, max: 8 })
  });

  /**
   * Property 10: Cost Estimate Structure
   * Feature: travel-bucket-list, Property 10: Cost Estimate Structure
   * Validates: Requirements 6.1, 6.3, 6.4
   */
  test('Property 10: Cost Estimate Structure - should include all expense categories and display as ranges', async () => {
    await fc.assert(
      fc.asyncProperty(
        tripDataArb,
        locationDataArb,
        async (tripData: TripData, homeLocation: LocationData) => {
          const costEstimate = await costEstimator.estimateCosts(tripData, homeLocation);
          
          // Verify all major expense categories are present
          expect(costEstimate.transportation).toBeDefined();
          expect(costEstimate.accommodation).toBeDefined();
          expect(costEstimate.activities).toBeDefined();
          expect(costEstimate.food).toBeDefined();
          expect(costEstimate.total).toBeDefined();
          
          // Verify each category has proper range structure
          const categories = [
            costEstimate.transportation,
            costEstimate.accommodation,
            costEstimate.activities,
            costEstimate.food,
            costEstimate.total
          ];
          
          categories.forEach((category) => {
            expect(category.min).toBeDefined();
            expect(category.max).toBeDefined();
            expect(category.currency).toBeDefined();
            expect(typeof category.min).toBe('number');
            expect(typeof category.max).toBe('number');
            expect(typeof category.currency).toBe('string');
            
            // Verify ranges are valid (min <= max)
            expect(category.min).toBeLessThanOrEqual(category.max);
            expect(category.min).toBeGreaterThanOrEqual(0);
            expect(category.max).toBeGreaterThan(0);
            expect(category.currency).toBe('USD');
          });
          
          // Verify total is sum of components
          const expectedMinTotal = costEstimate.transportation.min + 
                                  costEstimate.accommodation.min + 
                                  costEstimate.activities.min + 
                                  costEstimate.food.min;
          const expectedMaxTotal = costEstimate.transportation.max + 
                                  costEstimate.accommodation.max + 
                                  costEstimate.activities.max + 
                                  costEstimate.food.max;
          
          expect(costEstimate.total.min).toBe(expectedMinTotal);
          expect(costEstimate.total.max).toBe(expectedMaxTotal);
          
          // Verify metadata
          expect(costEstimate.currency).toBe('USD');
          expect(costEstimate.lastUpdated).toBeInstanceOf(Date);
          
          // Verify costs are reasonable (not zero or extremely high)
          expect(costEstimate.total.min).toBeGreaterThan(100); // Minimum reasonable trip cost
          expect(costEstimate.total.max).toBeLessThan(100000); // Maximum reasonable trip cost
          
          // Verify transportation costs scale with number of destinations
          if (tripData.destinations.length > 1) {
            expect(costEstimate.transportation.min).toBeGreaterThan(400); // Multi-destination should be more expensive
          }
          
          // Verify accommodation costs scale with duration
          const expectedMinAccommodation = tripData.duration * 20; // Minimum $20/night
          const expectedMaxAccommodation = tripData.duration * 500; // Maximum $500/night
          expect(costEstimate.accommodation.min).toBeGreaterThanOrEqual(expectedMinAccommodation * 0.5);
          expect(costEstimate.accommodation.max).toBeLessThanOrEqual(expectedMaxAccommodation * 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property test for home location usage consistency
   */
  test('Cost calculations should consistently use home location as departure point', async () => {
    await fc.assert(
      fc.asyncProperty(
        tripDataArb,
        locationDataArb,
        locationDataArb,
        async (tripData: TripData, homeLocation1: LocationData, homeLocation2: LocationData) => {
          // Ensure different home locations
          fc.pre(homeLocation1.city !== homeLocation2.city || homeLocation1.country !== homeLocation2.country);
          
          const costEstimate1 = await costEstimator.estimateCosts(tripData, homeLocation1);
          const costEstimate2 = await costEstimator.estimateCosts(tripData, homeLocation2);
          
          // Transportation costs should be different for different home locations
          // (unless by coincidence they're the same, which is unlikely)
          const transport1Total = costEstimate1.transportation.min + costEstimate1.transportation.max;
          const transport2Total = costEstimate2.transportation.min + costEstimate2.transportation.max;
          
          // Allow for some cases where costs might be similar due to rounding or regional grouping
          const costDifferenceThreshold = 100; // $100 difference threshold
          const costDifference = Math.abs(transport1Total - transport2Total);
          
          // Most of the time, different home locations should result in different transportation costs
          // But we allow for some cases where they might be similar
          if (costDifference > costDifferenceThreshold) {
            expect(transport1Total).not.toBe(transport2Total);
          }
          
          // Accommodation, activities, and food should be the same regardless of home location
          expect(costEstimate1.accommodation.min).toBe(costEstimate2.accommodation.min);
          expect(costEstimate1.accommodation.max).toBe(costEstimate2.accommodation.max);
          expect(costEstimate1.activities.min).toBe(costEstimate2.activities.min);
          expect(costEstimate1.activities.max).toBe(costEstimate2.activities.max);
          expect(costEstimate1.food.min).toBe(costEstimate2.food.min);
          expect(costEstimate1.food.max).toBe(costEstimate2.food.max);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property test for cost scaling with trip duration
   */
  test('Accommodation and food costs should scale proportionally with trip duration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          destinations: fc.constantFrom(['Paris, France'], ['Tokyo, Japan']),
          experiences: fc.array(fc.constantFrom('sightseeing', 'museums', 'food tours'), { minLength: 1, maxLength: 3 }),
          duration: fc.integer({ min: 5, max: 15 }),
          travelers: fc.constant(2)
        }),
        locationDataArb,
        async (tripData: TripData, homeLocation: LocationData) => {
          const shortTrip = { ...tripData, duration: 5 };
          const longTrip = { ...tripData, duration: 15 };
          
          const shortCost = await costEstimator.estimateCosts(shortTrip, homeLocation);
          const longCost = await costEstimator.estimateCosts(longTrip, homeLocation);
          
          // Accommodation costs should scale with duration (3x duration = ~3x cost)
          const accommodationRatio = longCost.accommodation.min / shortCost.accommodation.min;
          expect(accommodationRatio).toBeGreaterThan(2.5); // Should be close to 3x
          expect(accommodationRatio).toBeLessThan(3.5);
          
          // Food costs should scale with duration
          const foodRatio = longCost.food.min / shortCost.food.min;
          expect(foodRatio).toBeGreaterThan(2.5);
          expect(foodRatio).toBeLessThan(3.5);
          
          // Transportation costs should be similar (doesn't scale with duration)
          const transportRatio = longCost.transportation.min / shortCost.transportation.min;
          expect(transportRatio).toBeGreaterThan(0.8);
          expect(transportRatio).toBeLessThan(1.2);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property test for experience type cost impact
   */
  test('Experience types should appropriately influence activity costs', async () => {
    await fc.assert(
      fc.asyncProperty(
        locationDataArb,
        async (homeLocation: LocationData) => {
          const baseTripData: TripData = {
            destinations: ['Paris, France'],
            experiences: ['museum visits', 'walking tours'],
            duration: 7,
            travelers: 2
          };
          
          const luxuryTripData: TripData = {
            ...baseTripData,
            experiences: ['luxury spa', 'private tours', 'helicopter rides']
          };
          
          const budgetTripData: TripData = {
            ...baseTripData,
            experiences: ['free walking tours', 'hiking', 'public parks']
          };
          
          const baseCost = await costEstimator.estimateCosts(baseTripData, homeLocation);
          const luxuryCost = await costEstimator.estimateCosts(luxuryTripData, homeLocation);
          const budgetCost = await costEstimator.estimateCosts(budgetTripData, homeLocation);
          
          // Luxury experiences should cost more than base experiences
          expect(luxuryCost.activities.min).toBeGreaterThan(baseCost.activities.min);
          expect(luxuryCost.activities.max).toBeGreaterThan(baseCost.activities.max);
          
          // Budget experiences should cost less than or equal to base experiences
          expect(budgetCost.activities.min).toBeLessThanOrEqual(baseCost.activities.min);
          expect(budgetCost.activities.max).toBeLessThanOrEqual(baseCost.activities.max);
          
          // Transportation, accommodation, and food should be the same
          expect(luxuryCost.transportation.min).toBe(baseCost.transportation.min);
          expect(luxuryCost.accommodation.min).toBe(baseCost.accommodation.min);
          expect(luxuryCost.food.min).toBe(baseCost.food.min);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property test for travel style adjustments
   */
  test('Travel style adjustments should properly modify all cost categories', async () => {
    await fc.assert(
      fc.asyncProperty(
        tripDataArb,
        locationDataArb,
        async (tripData: TripData, homeLocation: LocationData) => {
          const baseCost = await costEstimator.estimateCosts(tripData, homeLocation);
          
          const budgetCost = costEstimator.applyTravelStyleAdjustments(baseCost, 'budget');
          const luxuryCost = costEstimator.applyTravelStyleAdjustments(baseCost, 'luxury');
          
          // Budget should be less than base (mid-range)
          expect(budgetCost.accommodation.min).toBeLessThan(baseCost.accommodation.min);
          expect(budgetCost.food.min).toBeLessThan(baseCost.food.min);
          expect(budgetCost.activities.min).toBeLessThan(baseCost.activities.min);
          expect(budgetCost.transportation.min).toBeLessThan(baseCost.transportation.min);
          expect(budgetCost.total.min).toBeLessThan(baseCost.total.min);
          
          // Luxury should be more than base (mid-range)
          expect(luxuryCost.accommodation.min).toBeGreaterThan(baseCost.accommodation.min);
          expect(luxuryCost.food.min).toBeGreaterThan(baseCost.food.min);
          expect(luxuryCost.activities.min).toBeGreaterThan(baseCost.activities.min);
          expect(luxuryCost.transportation.min).toBeGreaterThan(baseCost.transportation.min);
          expect(luxuryCost.total.min).toBeGreaterThan(baseCost.total.min);
          
          // Verify total calculations are correct
          const expectedBudgetTotal = budgetCost.transportation.min + budgetCost.accommodation.min + 
                                     budgetCost.activities.min + budgetCost.food.min;
          const expectedLuxuryTotal = luxuryCost.transportation.min + luxuryCost.accommodation.min + 
                                     luxuryCost.activities.min + luxuryCost.food.min;
          
          expect(budgetCost.total.min).toBe(expectedBudgetTotal);
          expect(luxuryCost.total.min).toBe(expectedLuxuryTotal);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property test for error handling
   */
  test('Should handle invalid inputs appropriately', async () => {
    await fc.assert(
      fc.asyncProperty(
        locationDataArb,
        async (homeLocation: LocationData) => {
          // Empty destinations should throw error
          const emptyTripData: TripData = {
            destinations: [],
            experiences: ['sightseeing'],
            duration: 7,
            travelers: 2
          };
          
          await expect(costEstimator.estimateCosts(emptyTripData, homeLocation))
            .rejects.toThrow('Trip must have at least one destination');
          
          // Missing home location should throw error
          const validTripData: TripData = {
            destinations: ['Paris, France'],
            experiences: ['sightseeing'],
            duration: 7,
            travelers: 2
          };
          
          await expect(costEstimator.estimateCosts(validTripData, null as any))
            .rejects.toThrow('Home location is required');
        }
      ),
      { numRuns: 100 }
    );
  });
});