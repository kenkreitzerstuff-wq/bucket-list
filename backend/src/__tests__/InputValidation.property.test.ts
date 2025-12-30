import * as fc from 'fast-check';
import { TravelInputService } from '../services/TravelInputService';
import { TravelInputData } from '../types';

/**
 * Property-based tests for Input Validation
 * Feature: travel-bucket-list, Property 2: Incomplete Input Validation
 * Feature: travel-bucket-list, Property 3: Vague Input Clarification
 * **Validates: Requirements 1.4, 1.5, 2.1, 2.2**
 */
describe('Input Validation Property Tests', () => {

  /**
   * Property 2: Incomplete Input Validation
   * For any incomplete or empty travel input, the system should prevent proceeding 
   * and generate appropriate follow-up questions
   */
  test('Property 2: Incomplete Input Validation', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Empty destinations
          fc.record({
            destinations: fc.constant([]),
            experiences: fc.array(fc.string({ minLength: 2, maxLength: 30 }), { minLength: 1, maxLength: 3 })
          }),
          // Empty experiences
          fc.record({
            destinations: fc.array(fc.string({ minLength: 2, maxLength: 30 }), { minLength: 1, maxLength: 3 }),
            experiences: fc.constant([])
          }),
          // Both empty
          fc.record({
            destinations: fc.constant([]),
            experiences: fc.constant([])
          }),
          // Very short destinations/experiences
          fc.record({
            destinations: fc.array(fc.string({ minLength: 1, maxLength: 1 }), { minLength: 1, maxLength: 2 }),
            experiences: fc.array(fc.string({ minLength: 1, maxLength: 1 }), { minLength: 1, maxLength: 2 })
          }),
          // Missing preferences
          fc.record({
            destinations: fc.array(fc.string({ minLength: 2, maxLength: 30 }), { minLength: 1, maxLength: 3 }),
            experiences: fc.array(fc.string({ minLength: 2, maxLength: 30 }), { minLength: 1, maxLength: 3 }),
            preferences: fc.constant(undefined)
          })
        ),
        (incompleteInput) => {
          const validation = TravelInputService.validateTravelInput(incompleteInput);
          
          // Incomplete input should be invalid
          expect(validation.isValid).toBe(false);
          expect(validation.errors.length).toBeGreaterThan(0);
          
          // Should detect incompleteness
          const incompleteAnalysis = TravelInputService.detectIncompleteInput(incompleteInput);
          expect(incompleteAnalysis.needsFollowUp).toBe(true);
          expect(incompleteAnalysis.incompleteAreas.length).toBeGreaterThan(0);
          expect(incompleteAnalysis.suggestions.length).toBeGreaterThan(0);
          
          // Should generate follow-up questions
          const questions = TravelInputService.generateFollowUpQuestions(incompleteInput);
          expect(questions.length).toBeGreaterThan(0);
          
          // Each question should have required fields
          questions.forEach(question => {
            expect(question.id).toBeDefined();
            expect(question.question).toBeDefined();
            expect(question.type).toMatch(/^(text|multiple-choice|range)$/);
            expect(question.context).toBeDefined();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Vague Input Clarification
   * For any vague or broad travel input (like "Europe" or "adventure"), 
   * the system should generate specific follow-up questions to clarify user intent
   */
  test('Property 3: Vague Input Clarification', () => {
    fc.assert(
      fc.property(
        fc.record({
          destinations: fc.array(
            fc.oneof(
              fc.constantFrom('europe', 'asia', 'africa', 'america', 'world', 'everywhere'),
              fc.string({ minLength: 2, maxLength: 30 }).filter(s => 
                !['europe', 'asia', 'africa', 'america', 'world'].includes(s.toLowerCase())
              )
            ),
            { minLength: 1, maxLength: 5 }
          ),
          experiences: fc.array(
            fc.oneof(
              fc.constantFrom('adventure', 'fun', 'experience', 'activity', 'something'),
              fc.string({ minLength: 5, maxLength: 30 }).filter(s => 
                !['adventure', 'fun', 'experience', 'activity'].includes(s.toLowerCase())
              )
            ),
            { minLength: 1, maxLength: 5 }
          )
        }),
        (vagueInput) => {
          // Check if input actually contains vague terms
          const hasVagueDestinations = vagueInput.destinations.some(dest =>
            ['europe', 'asia', 'africa', 'america', 'world', 'everywhere'].includes(dest.toLowerCase())
          );
          
          const hasVagueExperiences = vagueInput.experiences.some(exp =>
            ['adventure', 'fun', 'experience', 'activity', 'something'].includes(exp.toLowerCase())
          );
          
          if (hasVagueDestinations || hasVagueExperiences) {
            // Should detect need for follow-up
            const incompleteAnalysis = TravelInputService.detectIncompleteInput(vagueInput);
            expect(incompleteAnalysis.needsFollowUp).toBe(true);
            
            // Should generate clarifying questions
            const questions = TravelInputService.generateFollowUpQuestions(vagueInput);
            expect(questions.length).toBeGreaterThan(0);
            
            // Questions should be relevant to the vague input
            if (hasVagueDestinations) {
              const destinationQuestions = questions.filter(q => 
                q.context.toLowerCase().includes('destination') ||
                q.question.toLowerCase().includes('countries') ||
                q.question.toLowerCase().includes('regions')
              );
              expect(destinationQuestions.length).toBeGreaterThan(0);
            }
            
            if (hasVagueExperiences) {
              const experienceQuestions = questions.filter(q => 
                q.context.toLowerCase().includes('experience') ||
                q.question.toLowerCase().includes('activities') ||
                q.question.toLowerCase().includes('types')
              );
              expect(experienceQuestions.length).toBeGreaterThan(0);
            }
            
            // Validation should include warnings about vague input
            const validation = TravelInputService.validateTravelInput(vagueInput);
            if (validation.warnings) {
              const hasVagueWarning = validation.warnings.some(warning =>
                warning.toLowerCase().includes('vague') ||
                warning.toLowerCase().includes('specific')
              );
              expect(hasVagueWarning).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Validation should be deterministic
   * Same input should always produce same validation results
   */
  test('Property: Validation determinism', () => {
    fc.assert(
      fc.property(
        fc.record({
          destinations: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 }),
          experiences: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 }),
          preferences: fc.option(fc.record({
            travelStyle: fc.option(fc.constantFrom('budget', 'mid-range', 'luxury', 'adventure') as fc.Arbitrary<'budget' | 'mid-range' | 'luxury' | 'adventure'>, { nil: undefined }),
            groupSize: fc.option(fc.integer({ min: 1, max: 20 }), { nil: undefined })
          }), { nil: undefined })
        }),
        (travelInput) => {
          // Multiple validations should return identical results
          const validation1 = TravelInputService.validateTravelInput(travelInput);
          const validation2 = TravelInputService.validateTravelInput(travelInput);
          const validation3 = TravelInputService.validateTravelInput(travelInput);
          
          expect(validation1.isValid).toBe(validation2.isValid);
          expect(validation2.isValid).toBe(validation3.isValid);
          expect(validation1.errors).toEqual(validation2.errors);
          expect(validation2.errors).toEqual(validation3.errors);
          
          // Incomplete analysis should also be deterministic
          const analysis1 = TravelInputService.detectIncompleteInput(travelInput);
          const analysis2 = TravelInputService.detectIncompleteInput(travelInput);
          
          expect(analysis1.needsFollowUp).toBe(analysis2.needsFollowUp);
          expect(analysis1.incompleteAreas).toEqual(analysis2.incompleteAreas);
          expect(analysis1.suggestions).toEqual(analysis2.suggestions);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Valid input should not need follow-up
   * Complete, specific input should not trigger follow-up questions
   */
  test('Property: Complete input needs no follow-up', () => {
    fc.assert(
      fc.property(
        fc.record({
          destinations: fc.array(
            fc.string({ minLength: 5, maxLength: 30 }).filter(s => 
              !['europe', 'asia', 'africa', 'america', 'world'].some(term => 
                s.toLowerCase().includes(term)
              )
            ),
            { minLength: 1, maxLength: 3 }
          ),
          experiences: fc.array(
            fc.string({ minLength: 10, maxLength: 50 }).filter(s => 
              !['adventure', 'fun', 'experience', 'activity'].some(term => 
                s.toLowerCase().includes(term)
              )
            ),
            { minLength: 1, maxLength: 3 }
          ),
          preferences: fc.record({
            travelStyle: fc.constantFrom('budget', 'mid-range', 'luxury', 'adventure') as fc.Arbitrary<'budget' | 'mid-range' | 'luxury' | 'adventure'>,
            interests: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
            groupSize: fc.integer({ min: 1, max: 10 }),
            budgetRange: fc.record({
              min: fc.integer({ min: 500, max: 5000 }),
              max: fc.integer({ min: 2000, max: 20000 }),
              currency: fc.constant('USD')
            })
          })
        }),
        (completeInput) => {
          // Ensure budget range is valid
          fc.pre(completeInput.preferences.budgetRange.min < completeInput.preferences.budgetRange.max);
          
          const validation = TravelInputService.validateTravelInput(completeInput);
          const incompleteAnalysis = TravelInputService.detectIncompleteInput(completeInput);
          
          // Should be valid
          expect(validation.isValid).toBe(true);
          expect(validation.errors.length).toBe(0);
          
          // Should not need follow-up (or need very little)
          expect(incompleteAnalysis.incompleteAreas.length).toBeLessThanOrEqual(1);
          
          // Completeness score should be high
          const completenessScore = TravelInputService.calculateCompletenessScore(completeInput);
          expect(completenessScore).toBeGreaterThanOrEqual(70);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Follow-up questions should be well-formed
   * All generated questions should have proper structure and content
   */
  test('Property: Follow-up questions structure', () => {
    fc.assert(
      fc.property(
        fc.record({
          destinations: fc.array(
            fc.oneof(
              fc.constantFrom('europe', 'asia', 'world'),
              fc.string({ minLength: 2, maxLength: 20 })
            ),
            { minLength: 1, maxLength: 3 }
          ),
          experiences: fc.array(
            fc.oneof(
              fc.constantFrom('adventure', 'fun'),
              fc.string({ minLength: 2, maxLength: 20 })
            ),
            { minLength: 1, maxLength: 3 }
          )
        }),
        (travelInput) => {
          const questions = TravelInputService.generateFollowUpQuestions(travelInput);
          
          questions.forEach(question => {
            // Each question should have required fields
            expect(question.id).toBeDefined();
            expect(typeof question.id).toBe('string');
            expect(question.id.length).toBeGreaterThan(0);
            
            expect(question.question).toBeDefined();
            expect(typeof question.question).toBe('string');
            expect(question.question.length).toBeGreaterThan(10); // Reasonable question length
            
            expect(question.type).toMatch(/^(text|multiple-choice|range)$/);
            
            expect(question.context).toBeDefined();
            expect(typeof question.context).toBe('string');
            expect(question.context.length).toBeGreaterThan(0);
            
            // Multiple choice and range questions should have options
            if (question.type === 'multiple-choice' || question.type === 'range') {
              expect(question.options).toBeDefined();
              expect(Array.isArray(question.options)).toBe(true);
              expect(question.options!.length).toBeGreaterThan(0);
              
              // Each option should be a non-empty string
              question.options!.forEach(option => {
                expect(typeof option).toBe('string');
                expect(option.length).toBeGreaterThan(0);
              });
            }
            
            // Question should end with question mark
            expect(question.question.endsWith('?')).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Normalization should preserve validity
   * If input is valid before normalization, it should remain valid after
   */
  test('Property: Normalization preserves validity', () => {
    fc.assert(
      fc.property(
        fc.record({
          destinations: fc.array(
            fc.string({ minLength: 3, maxLength: 30 }).map(s => `  ${s}  `), // Add whitespace
            { minLength: 1, maxLength: 3 }
          ),
          experiences: fc.array(
            fc.string({ minLength: 3, maxLength: 30 }).map(s => `  ${s}  `), // Add whitespace
            { minLength: 1, maxLength: 3 }
          ),
          preferences: fc.option(fc.record({
            travelStyle: fc.constantFrom('budget', 'mid-range', 'luxury', 'adventure') as fc.Arbitrary<'budget' | 'mid-range' | 'luxury' | 'adventure'>,
            groupSize: fc.integer({ min: 1, max: 10 })
          }), { nil: undefined })
        }),
        (travelInput) => {
          const originalValidation = TravelInputService.validateTravelInput(travelInput);
          const normalized = TravelInputService.normalizeTravelInput(travelInput);
          const normalizedValidation = TravelInputService.validateTravelInput(normalized);
          
          // If original was valid, normalized should be valid too
          if (originalValidation.isValid) {
            expect(normalizedValidation.isValid).toBe(true);
          }
          
          // Normalized version should have no leading/trailing whitespace
          normalized.destinations.forEach(dest => {
            expect(dest).toBe(dest.trim());
          });
          
          normalized.experiences.forEach(exp => {
            expect(exp).toBe(exp.trim());
          });
          
          // Should not lose any non-empty items during normalization
          const originalNonEmptyDests = travelInput.destinations?.filter(d => d.trim().length > 0) || [];
          const originalNonEmptyExps = travelInput.experiences?.filter(e => e.trim().length > 0) || [];
          
          expect(normalized.destinations.length).toBe(originalNonEmptyDests.length);
          expect(normalized.experiences.length).toBe(originalNonEmptyExps.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Budget validation should be consistent
   * Invalid budget ranges should always be rejected
   */
  test('Property: Budget validation consistency', () => {
    fc.assert(
      fc.property(
        fc.record({
          destinations: fc.array(fc.string({ minLength: 2, maxLength: 20 }), { minLength: 1, maxLength: 2 }),
          experiences: fc.array(fc.string({ minLength: 2, maxLength: 20 }), { minLength: 1, maxLength: 2 }),
          preferences: fc.record({
            budgetRange: fc.oneof(
              // Invalid: min >= max
              fc.record({
                min: fc.integer({ min: 1000, max: 5000 }),
                max: fc.integer({ min: 500, max: 1000 }),
                currency: fc.constant('USD')
              }),
              // Invalid: negative values
              fc.record({
                min: fc.integer({ min: -1000, max: -1 }),
                max: fc.integer({ min: 1000, max: 5000 }),
                currency: fc.constant('USD')
              }),
              // Valid range
              fc.record({
                min: fc.integer({ min: 100, max: 2000 }),
                max: fc.integer({ min: 3000, max: 10000 }),
                currency: fc.constant('USD')
              })
            )
          })
        }),
        (travelInput) => {
          const validation = TravelInputService.validateTravelInput(travelInput);
          const budgetRange = travelInput.preferences.budgetRange;
          
          // Check if budget range is actually invalid
          const isInvalidBudget = budgetRange.min < 0 || 
                                 budgetRange.max < 0 || 
                                 budgetRange.min >= budgetRange.max;
          
          if (isInvalidBudget) {
            // Should be invalid
            expect(validation.isValid).toBe(false);
            
            // Should have budget-related error
            const hasBudgetError = validation.errors.some(error =>
              error.toLowerCase().includes('budget') ||
              error.toLowerCase().includes('positive') ||
              error.toLowerCase().includes('maximum') ||
              error.toLowerCase().includes('minimum')
            );
            expect(hasBudgetError).toBe(true);
          } else {
            // Valid budget should not cause budget-related errors
            const budgetErrors = validation.errors.filter(error =>
              error.toLowerCase().includes('budget')
            );
            expect(budgetErrors.length).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});