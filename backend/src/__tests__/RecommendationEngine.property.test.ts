import * as fc from 'fast-check';
import { RecommendationEngine } from '../services/RecommendationEngine';
import { UserProfile, TravelInputData, Recommendation, FollowUpQuestion } from '../types';

/**
 * Property-based tests for RecommendationEngine
 * Feature: travel-bucket-list
 */

describe('RecommendationEngine Property Tests', () => {
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
      'adventure', 'culture', 'nature', 'food', 'history', 'relaxation', 
      'photography', 'wildlife', 'hiking', 'beach', 'museums', 'nightlife'
    ), { minLength: 1, maxLength: 5 }),
    travelDuration: fc.constantFrom('short', 'medium', 'long') as fc.Arbitrary<'short' | 'medium' | 'long'>,
    groupSize: fc.integer({ min: 1, max: 8 }),
    accessibility: fc.option(fc.array(fc.string(), { maxLength: 3 }), { nil: undefined })
  });

  const userProfileArb = fc.record({
    id: fc.uuid(),
    homeLocation: locationDataArb,
    preferences: travelPreferencesArb,
    bucketList: fc.array(fc.record({
      id: fc.uuid(),
      destination: fc.string({ minLength: 5, maxLength: 100 }),
      experiences: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
      estimatedDuration: fc.integer({ min: 1, max: 30 }),
      costEstimate: fc.record({
        min: fc.integer({ min: 500, max: 5000 }),
        max: fc.integer({ min: 5000, max: 50000 }),
        currency: fc.constant('USD')
      }),
      priority: fc.integer({ min: 1, max: 5 }),
      status: fc.constantFrom('planned', 'booked', 'completed') as fc.Arbitrary<'planned' | 'booked' | 'completed'>,
      notes: fc.option(fc.string({ maxLength: 200 }), { nil: undefined })
    }), { maxLength: 10 })
  });

  const travelInputDataArb = fc.record({
    destinations: fc.array(fc.constantFrom(
      'Paris', 'Tokyo', 'New York', 'London', 'Rome', 'Barcelona', 'Thailand', 
      'Iceland', 'Peru', 'New Zealand', 'Morocco', 'Italy', 'Europe', 'Asia'
    ), { minLength: 1, maxLength: 5 }),
    experiences: fc.array(fc.constantFrom(
      'hiking', 'cultural tours', 'food experiences', 'adventure sports', 
      'photography', 'wildlife viewing', 'beach relaxation', 'museums', 
      'local festivals', 'cooking classes', 'adventure', 'sightseeing'
    ), { minLength: 1, maxLength: 5 }),
    preferences: fc.option(travelPreferencesArb, { nil: undefined }),
    timeframe: fc.option(fc.record({
      flexibility: fc.constantFrom('flexible', 'fixed', 'seasonal', 'very-flexible') as fc.Arbitrary<'flexible' | 'fixed' | 'seasonal' | 'very-flexible'>,
      preferredMonths: fc.option(fc.array(fc.integer({ min: 1, max: 12 }), { minLength: 1, maxLength: 6 }), { nil: undefined }),
      duration: fc.option(fc.integer({ min: 3, max: 30 }), { nil: undefined })
    }), { nil: undefined })
  });

  /**
   * Property 4: Follow-up Integration
   * Feature: travel-bucket-list, Property 4: Follow-up Integration
   * Validates: Requirements 2.4
   */
  test('Property 4: Follow-up Integration - answers should be incorporated into recommendations', async () => {
    await fc.assert(
      fc.asyncProperty(
        userProfileArb,
        travelInputDataArb,
        fc.record({
          'budget-specification': fc.constantFrom(
            'Under $1,500 (Budget travel)',
            '$1,500 - $3,500 (Mid-range comfort)',
            '$3,500 - $7,500 (Premium experience)'
          ),
          'experience-specification': fc.array(fc.constantFrom(
            'Outdoor adventures (hiking, water sports, wildlife)',
            'Cultural immersion (local traditions, festivals, communities)',
            'Culinary experiences (cooking classes, food tours, markets)'
          ), { minLength: 1, maxLength: 2 })
        }),
        async (userProfile: UserProfile, travelInput: TravelInputData, followUpAnswers: any) => {
          // Generate initial recommendations
          const initialRecommendations = await RecommendationEngine.generateRecommendations(userProfile, travelInput);
          
          // Process follow-up answers
          const result = await RecommendationEngine.integrateFollowUpAnswers(
            travelInput,
            followUpAnswers,
            userProfile
          );
          
          // Verify follow-up answers are integrated
          expect(result.updatedInput).toBeDefined();
          expect(result.recommendations).toBeDefined();
          expect(Array.isArray(result.recommendations)).toBe(true);
          
          // Verify budget integration
          if (followUpAnswers['budget-specification']) {
            expect(result.updatedInput.preferences?.budgetRange).toBeDefined();
            expect(result.updatedInput.preferences?.budgetRange?.min).toBeGreaterThan(0);
            expect(result.updatedInput.preferences?.budgetRange?.max).toBeGreaterThan(
              result.updatedInput.preferences?.budgetRange?.min || 0
            );
          }
          
          // Verify experience integration
          if (followUpAnswers['experience-specification']) {
            expect(result.updatedInput.experiences.length).toBeGreaterThanOrEqual(travelInput.experiences.length);
          }
          
          // Verify recommendations reflect the updated input
          expect(result.recommendations.length).toBeGreaterThan(0);
          expect(result.recommendations.length).toBeLessThanOrEqual(8);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Recommendation Relevance
   * Feature: travel-bucket-list, Property 5: Recommendation Relevance
   * Validates: Requirements 3.1, 3.2
   */
  test('Property 5: Recommendation Relevance - recommendations should be relevant to user preferences', async () => {
    await fc.assert(
      fc.asyncProperty(
        userProfileArb,
        travelInputDataArb,
        async (userProfile: UserProfile, travelInput: TravelInputData) => {
          const recommendations = await RecommendationEngine.generateRecommendations(userProfile, travelInput);
          
          // Verify basic structure
          expect(Array.isArray(recommendations)).toBe(true);
          expect(recommendations.length).toBeGreaterThan(0);
          expect(recommendations.length).toBeLessThanOrEqual(8);
          
          // Verify each recommendation has required properties
          recommendations.forEach((rec: Recommendation) => {
            expect(rec.type).toMatch(/^(destination|experience)$/);
            expect(typeof rec.title).toBe('string');
            expect(rec.title.length).toBeGreaterThan(0);
            expect(typeof rec.description).toBe('string');
            expect(rec.description.length).toBeGreaterThan(0);
            expect(typeof rec.reasoning).toBe('string');
            expect(rec.reasoning.length).toBeGreaterThan(0);
            expect(typeof rec.confidence).toBe('number');
            expect(rec.confidence).toBeGreaterThanOrEqual(0);
            expect(rec.confidence).toBeLessThanOrEqual(1);
            expect(Array.isArray(rec.relatedTo)).toBe(true);
            expect(rec.relatedTo.length).toBeGreaterThan(0);
          });
          
          // Verify relevance to user input
          const hasRelevantRecommendations = recommendations.some((rec: Recommendation) => {
            // Check if recommendation relates to user's destinations
            const destinationRelevant = travelInput.destinations.some((dest: string) =>
              rec.relatedTo.some((related: string) => 
                related.toLowerCase().includes(dest.toLowerCase()) ||
                dest.toLowerCase().includes(related.toLowerCase()) ||
                rec.title.toLowerCase().includes(dest.toLowerCase()) ||
                rec.description.toLowerCase().includes(dest.toLowerCase())
              )
            );
            
            // Check if recommendation relates to user's experiences
            const experienceRelevant = travelInput.experiences.some((exp: string) =>
              rec.relatedTo.some((related: string) => 
                related.toLowerCase().includes(exp.toLowerCase()) ||
                exp.toLowerCase().includes(related.toLowerCase()) ||
                rec.title.toLowerCase().includes(exp.toLowerCase()) ||
                rec.description.toLowerCase().includes(exp.toLowerCase())
              )
            );
            
            // Check if recommendation relates to user's interests
            const interestRelevant = travelInput.preferences?.interests?.some((interest: string) =>
              rec.relatedTo.some((related: string) => 
                related.toLowerCase().includes(interest.toLowerCase()) ||
                interest.toLowerCase().includes(related.toLowerCase()) ||
                rec.title.toLowerCase().includes(interest.toLowerCase()) ||
                rec.description.toLowerCase().includes(interest.toLowerCase())
              )
            ) || false;
            
            return destinationRelevant || experienceRelevant || interestRelevant;
          });
          
          expect(hasRelevantRecommendations).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6: Recommendation Completeness
   * Feature: travel-bucket-list, Property 6: Recommendation Completeness
   * Validates: Requirements 3.3
   */
  test('Property 6: Recommendation Completeness - recommendations should include detailed descriptions and reasoning', async () => {
    await fc.assert(
      fc.asyncProperty(
        userProfileArb,
        travelInputDataArb,
        async (userProfile: UserProfile, travelInput: TravelInputData) => {
          const recommendations = await RecommendationEngine.generateRecommendations(userProfile, travelInput);
          
          // Verify each recommendation has complete information
          recommendations.forEach((rec: Recommendation) => {
            // Verify detailed description (minimum length and content)
            expect(rec.description.length).toBeGreaterThan(20); // Minimum meaningful description
            expect(rec.description).toMatch(/[.!?]$/); // Ends with proper punctuation
            
            // Verify reasoning is provided and meaningful
            expect(rec.reasoning.length).toBeGreaterThan(10); // Minimum meaningful reasoning
            expect(rec.reasoning).toMatch(/[.!?]$/); // Ends with proper punctuation
            
            // Verify reasoning explains the recommendation
            const reasoningLower = rec.reasoning.toLowerCase();
            const hasExplanation = 
              reasoningLower.includes('match') ||
              reasoningLower.includes('align') ||
              reasoningLower.includes('based on') ||
              reasoningLower.includes('because') ||
              reasoningLower.includes('interest') ||
              reasoningLower.includes('preference') ||
              reasoningLower.includes('bucket list') ||
              reasoningLower.includes('recommend');
            
            expect(hasExplanation).toBe(true);
            
            // Verify metadata is present and meaningful
            if (rec.metadata) {
              if (rec.metadata.duration) {
                expect(rec.metadata.duration).toBeGreaterThan(0);
                expect(rec.metadata.duration).toBeLessThanOrEqual(30);
              }
              if (rec.metadata.difficulty) {
                expect(rec.metadata.difficulty).toMatch(/^(easy|moderate|challenging)$/);
              }
              if (rec.metadata.season) {
                expect(typeof rec.metadata.season).toBe('string');
                expect(rec.metadata.season.length).toBeGreaterThan(0);
              }
            }
            
            // Verify relatedTo provides context
            expect(rec.relatedTo.length).toBeGreaterThan(0);
            rec.relatedTo.forEach((related: string) => {
              expect(typeof related).toBe('string');
              expect(related.length).toBeGreaterThan(0);
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Follow-up Questions Generation Test
   */
  test('Follow-up questions should be generated for vague inputs', async () => {
    await fc.assert(
      fc.asyncProperty(
        userProfileArb,
        fc.record({
          destinations: fc.constantFrom(['Europe'], ['Asia'], ['adventure']),
          experiences: fc.constantFrom(['fun'], ['adventure'], ['something interesting']),
          preferences: fc.option(fc.record({
            budgetRange: fc.record({
              min: fc.constant(0),
              max: fc.constant(0),
              currency: fc.constant('USD')
            }),
            travelStyle: fc.constantFrom('budget', 'mid-range', 'luxury', 'adventure') as fc.Arbitrary<'budget' | 'mid-range' | 'luxury' | 'adventure'>,
            interests: fc.array(fc.string(), { maxLength: 2 }),
            travelDuration: fc.constantFrom('short', 'medium', 'long') as fc.Arbitrary<'short' | 'medium' | 'long'>,
            groupSize: fc.integer({ min: 1, max: 4 })
          }), { nil: undefined })
        }),
        async (userProfile: UserProfile, vagueInput: TravelInputData) => {
          const questions = await RecommendationEngine.generateContextualFollowUpQuestions(
            vagueInput,
            userProfile
          );
          
          // Should generate questions for vague inputs
          expect(Array.isArray(questions)).toBe(true);
          expect(questions.length).toBeGreaterThan(0);
          
          // Verify question structure
          questions.forEach((question: FollowUpQuestion) => {
            expect(typeof question.id).toBe('string');
            expect(question.id.length).toBeGreaterThan(0);
            expect(typeof question.question).toBe('string');
            expect(question.question.length).toBeGreaterThan(0);
            expect(question.type).toMatch(/^(multiple-choice|text|range|date)$/);
            expect(typeof question.required).toBe('boolean');
            expect(typeof question.context).toBe('string');
            expect(question.context.length).toBeGreaterThan(0);
            
            if (question.type === 'multiple-choice') {
              expect(Array.isArray(question.options)).toBe(true);
              expect(question.options!.length).toBeGreaterThan(0);
            }
          });
          
          // Should have questions for vague destinations
          const hasDestinationQuestions = questions.some((q: FollowUpQuestion) =>
            q.id.includes('clarification') || q.question.toLowerCase().includes('region')
          );
          
          // Should have questions for vague experiences
          const hasExperienceQuestions = questions.some((q: FollowUpQuestion) =>
            q.id.includes('experience') || q.question.toLowerCase().includes('activities')
          );
          
          // Should have questions for missing budget
          const hasBudgetQuestions = questions.some((q: FollowUpQuestion) =>
            q.id.includes('budget') || q.question.toLowerCase().includes('budget')
          );
          
          expect(hasDestinationQuestions || hasExperienceQuestions || hasBudgetQuestions).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Bucket List Integration Test
   */
  test('Recommendations should include bucket list items when relevant', async () => {
    await fc.assert(
      fc.asyncProperty(
        userProfileArb,
        fc.record({
          destinations: fc.constantFrom(['Peru'], ['Iceland'], ['New Zealand'], ['Africa']),
          experiences: fc.constantFrom(['hiking'], ['wildlife'], ['adventure'], ['photography']),
          preferences: fc.option(travelPreferencesArb, { nil: undefined })
        }),
        async (userProfile: UserProfile, bucketListInput: TravelInputData) => {
          const recommendations = await RecommendationEngine.generateRecommendations(userProfile, bucketListInput);
          
          expect(recommendations.length).toBeGreaterThan(0);
          
          // Should include some bucket list recommendations
          const hasBucketListRecommendations = recommendations.some((rec: Recommendation) => {
            const reasoningLower = rec.reasoning.toLowerCase();
            return reasoningLower.includes('bucket list') || 
                   reasoningLower.includes('ken') || 
                   reasoningLower.includes('gail');
          });
          
          // For destinations that match bucket list items, should have bucket list recommendations
          const matchesBucketList = bucketListInput.destinations.some((dest: string) => {
            const destLower = dest.toLowerCase();
            return destLower.includes('peru') || 
                   destLower.includes('iceland') || 
                   destLower.includes('new zealand') || 
                   destLower.includes('africa');
          });
          
          if (matchesBucketList) {
            expect(hasBucketListRecommendations).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});