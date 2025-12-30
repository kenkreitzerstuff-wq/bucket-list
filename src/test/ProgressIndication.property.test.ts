import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { ProgressIndicator, ProgressStep } from '../components/ProgressIndicator';
import React from 'react';

/**
 * Property-Based Tests for Progress Indication
 * **Feature: travel-bucket-list, Property 12: Progress Indication**
 * **Validates: Requirements 8.2**
 */

// Generators for property-based testing
const stepStatusArbitrary = fc.constantFrom('pending', 'active', 'completed', 'error');

const progressStepArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
  status: stepStatusArbitrary,
  isOptional: fc.option(fc.boolean())
});

const progressStepsArbitrary = fc.array(progressStepArbitrary, { minLength: 1, maxLength: 10 });

const variantArbitrary = fc.constantFrom('horizontal', 'vertical');
const sizeArbitrary = fc.constantFrom('small', 'medium', 'large');

describe('Progress Indication Property Tests', () => {
  /**
   * Property 12: Progress Indication
   * For any step in the travel planning process, the system should display clear progress 
   * indicators showing current step and overall completion status
   */
  
  it('should always display progress percentage based on completed steps', () => {
    fc.assert(fc.property(
      progressStepsArbitrary,
      fc.integer({ min: 0, max: 9 }),
      (steps, currentStepIndex) => {
        // Ensure we have a valid current step
        const validCurrentStepIndex = Math.min(currentStepIndex, steps.length - 1);
        const currentStepId = steps[validCurrentStepIndex]?.id || steps[0].id;
        
        const { container } = render(
          React.createElement(ProgressIndicator, {
            steps,
            currentStepId,
            showDescriptions: true
          })
        );
        
        // Calculate expected completion percentage
        const completedSteps = steps.filter(step => step.status === 'completed').length;
        const expectedPercentage = Math.round((completedSteps / steps.length) * 100);
        
        // Check that progress percentage is displayed
        const progressText = container.querySelector('.progress-summary__percentage');
        expect(progressText).toBeTruthy();
        
        if (progressText) {
          const displayedPercentage = parseInt(progressText.textContent?.match(/\d+/)?.[0] || '0');
          expect(displayedPercentage).toBe(expectedPercentage);
        }
        
        // Verify progress percentage is between 0 and 100
        expect(expectedPercentage).toBeGreaterThanOrEqual(0);
        expect(expectedPercentage).toBeLessThanOrEqual(100);
      }
    ), { numRuns: 100 });
  });

  it('should always show current step information', () => {
    fc.assert(fc.property(
      progressStepsArbitrary,
      (steps) => {
        // Pick a random step as current
        const currentStep = steps[Math.floor(Math.random() * steps.length)];
        
        const { container } = render(
          React.createElement(ProgressIndicator, {
            steps,
            currentStepId: currentStep.id,
            showDescriptions: true
          })
        );
        
        // Check that current step information is displayed
        const stepText = container.querySelector('.progress-summary__text');
        expect(stepText).toBeTruthy();
        
        if (stepText) {
          const stepInfo = stepText.textContent || '';
          expect(stepInfo).toMatch(/Step \d+ of \d+/);
          
          // Extract step numbers
          const match = stepInfo.match(/Step (\d+) of (\d+)/);
          if (match) {
            const currentStepNum = parseInt(match[1]);
            const totalSteps = parseInt(match[2]);
            
            expect(currentStepNum).toBeGreaterThan(0);
            expect(currentStepNum).toBeLessThanOrEqual(totalSteps);
            expect(totalSteps).toBe(steps.length);
          }
        }
      }
    ), { numRuns: 100 });
  });

  it('should display all provided steps with correct status indicators', () => {
    fc.assert(fc.property(
      progressStepsArbitrary,
      (steps) => {
        const currentStepId = steps[0].id;
        
        const { container } = render(
          React.createElement(ProgressIndicator, {
            steps,
            currentStepId,
            showDescriptions: true
          })
        );
        
        // Check that all steps are rendered
        const renderedSteps = container.querySelectorAll('.progress-step');
        expect(renderedSteps.length).toBe(steps.length);
        
        // Verify each step has the correct status class
        steps.forEach((step, index) => {
          const stepElement = renderedSteps[index];
          expect(stepElement).toBeTruthy();
          
          if (stepElement) {
            const expectedStatusClass = `progress-step--${step.status}`;
            expect(stepElement.classList.contains(expectedStatusClass)).toBe(true);
            
            // Check for optional badge if step is optional
            if (step.isOptional) {
              const optionalBadge = stepElement.querySelector('.progress-step__optional-badge');
              expect(optionalBadge).toBeTruthy();
            }
          }
        });
      }
    ), { numRuns: 100 });
  });

  it('should show loading indicator for active steps', () => {
    fc.assert(fc.property(
      progressStepsArbitrary,
      (steps) => {
        // Set at least one step to active status
        const modifiedSteps = steps.map((step, index) => ({
          ...step,
          status: index === 0 ? 'active' as const : step.status
        }));
        
        const currentStepId = modifiedSteps[0].id;
        
        const { container } = render(
          React.createElement(ProgressIndicator, {
            steps: modifiedSteps,
            currentStepId,
            showDescriptions: true
          })
        );
        
        // Check for loading indicator on active step
        const activeSteps = container.querySelectorAll('.progress-step--active');
        expect(activeSteps.length).toBeGreaterThan(0);
        
        // At least one active step should have a loading indicator
        let hasLoadingIndicator = false;
        activeSteps.forEach(activeStep => {
          const loadingElement = activeStep.querySelector('.progress-step__loading');
          if (loadingElement) {
            hasLoadingIndicator = true;
            
            // Check for spinner and loading text
            const spinner = loadingElement.querySelector('.progress-step__spinner');
            const loadingText = loadingElement.querySelector('.progress-step__loading-text');
            
            expect(spinner).toBeTruthy();
            expect(loadingText).toBeTruthy();
            expect(loadingText?.textContent).toContain('In progress');
          }
        });
        
        expect(hasLoadingIndicator).toBe(true);
      }
    ), { numRuns: 100 });
  });

  it('should maintain consistent step ordering regardless of status', () => {
    fc.assert(fc.property(
      progressStepsArbitrary,
      (steps) => {
        const currentStepId = steps[0].id;
        
        const { container } = render(
          React.createElement(ProgressIndicator, {
            steps,
            currentStepId,
            showDescriptions: true
          })
        );
        
        // Get all step titles in order
        const stepTitles = Array.from(container.querySelectorAll('.progress-step__title'))
          .map(element => element.textContent?.replace(/Optional$/, '').trim());
        
        // Verify the order matches the input order
        const expectedTitles = steps.map(step => step.title);
        
        expect(stepTitles.length).toBe(expectedTitles.length);
        stepTitles.forEach((title, index) => {
          expect(title).toBe(expectedTitles[index]);
        });
      }
    ), { numRuns: 100 });
  });

  it('should handle different variants and sizes without breaking', () => {
    fc.assert(fc.property(
      progressStepsArbitrary,
      variantArbitrary,
      sizeArbitrary,
      (steps, variant, size) => {
        const currentStepId = steps[0].id;
        
        const { container } = render(
          React.createElement(ProgressIndicator, {
            steps,
            currentStepId,
            variant,
            size,
            showDescriptions: true
          })
        );
        
        // Check that the component renders with correct variant and size classes
        const progressIndicator = container.querySelector('.progress-indicator');
        expect(progressIndicator).toBeTruthy();
        
        if (progressIndicator) {
          expect(progressIndicator.classList.contains(`progress-indicator--${variant}`)).toBe(true);
          expect(progressIndicator.classList.contains(`progress-indicator--${size}`)).toBe(true);
        }
        
        // Ensure all steps are still rendered
        const renderedSteps = container.querySelectorAll('.progress-step');
        expect(renderedSteps.length).toBe(steps.length);
        
        // Ensure progress summary is still present
        const progressSummary = container.querySelector('.progress-summary');
        expect(progressSummary).toBeTruthy();
      }
    ), { numRuns: 100 });
  });

  it('should show descriptions when showDescriptions is true', () => {
    fc.assert(fc.property(
      progressStepsArbitrary.filter(steps => 
        steps.some(step => step.description !== undefined && step.description !== null)
      ),
      (steps) => {
        const currentStepId = steps[0].id;
        
        // Test with descriptions enabled
        const { container: withDescriptions } = render(
          React.createElement(ProgressIndicator, {
            steps,
            currentStepId,
            showDescriptions: true
          })
        );
        
        // Test with descriptions disabled
        const { container: withoutDescriptions } = render(
          React.createElement(ProgressIndicator, {
            steps,
            currentStepId,
            showDescriptions: false
          })
        );
        
        // Count steps with descriptions
        const stepsWithDescriptions = steps.filter(step => step.description);
        
        if (stepsWithDescriptions.length > 0) {
          // Should show descriptions when enabled
          const descriptionsShown = withDescriptions.querySelectorAll('.progress-step__description');
          expect(descriptionsShown.length).toBeGreaterThan(0);
          
          // Should not show descriptions when disabled
          const descriptionsHidden = withoutDescriptions.querySelectorAll('.progress-step__description');
          expect(descriptionsHidden.length).toBe(0);
        }
      }
    ), { numRuns: 50 });
  });

  it('should calculate progress bar width correctly for horizontal variant', () => {
    fc.assert(fc.property(
      progressStepsArbitrary,
      (steps) => {
        const currentStepId = steps[0].id;
        
        const { container } = render(
          React.createElement(ProgressIndicator, {
            steps,
            currentStepId,
            variant: 'horizontal',
            showDescriptions: true
          })
        );
        
        // Check for progress bar in horizontal variant
        const progressBar = container.querySelector('.progress-bar__fill');
        expect(progressBar).toBeTruthy();
        
        if (progressBar) {
          const style = window.getComputedStyle(progressBar);
          const width = style.width;
          
          // Calculate expected width
          const completedSteps = steps.filter(step => step.status === 'completed').length;
          const expectedPercentage = (completedSteps / steps.length) * 100;
          
          // Width should be set as a percentage
          expect(width).toBe(`${expectedPercentage}%`);
        }
      }
    ), { numRuns: 100 });
  });
});

// Integration test to ensure progress indication works with realistic travel planning steps
describe('Travel Planning Progress Integration', () => {
  it('should handle typical travel planning workflow progression', () => {
    const travelPlanningSteps: ProgressStep[] = [
      {
        id: 'home-location',
        title: 'Home Location',
        description: 'Set your departure point',
        status: 'completed'
      },
      {
        id: 'travel-input',
        title: 'Travel Preferences',
        description: 'Share your travel dreams',
        status: 'completed'
      },
      {
        id: 'follow-up',
        title: 'Clarification',
        description: 'Answer follow-up questions',
        status: 'active',
        isOptional: true
      },
      {
        id: 'complete',
        title: 'Complete',
        description: 'Your profile is ready',
        status: 'pending'
      }
    ];

    const { container } = render(
      React.createElement(ProgressIndicator, {
        steps: travelPlanningSteps,
        currentStepId: 'follow-up',
        showDescriptions: true,
        variant: 'horizontal',
        size: 'medium'
      })
    );

    // Verify all expected elements are present
    expect(container.querySelector('.progress-indicator')).toBeTruthy();
    expect(container.querySelector('.progress-bar')).toBeTruthy();
    expect(container.querySelector('.progress-steps')).toBeTruthy();
    expect(container.querySelector('.progress-summary')).toBeTruthy();

    // Check step count
    const steps = container.querySelectorAll('.progress-step');
    expect(steps.length).toBe(4);

    // Check progress calculation (2 completed out of 4 = 50%)
    const progressText = container.querySelector('.progress-summary__percentage');
    expect(progressText?.textContent).toContain('50%');

    // Check current step indication
    const stepText = container.querySelector('.progress-summary__text');
    expect(stepText?.textContent).toContain('Step 3 of 4');

    // Check active step has loading indicator
    const activeStep = container.querySelector('.progress-step--active');
    expect(activeStep).toBeTruthy();
    expect(activeStep?.querySelector('.progress-step__loading')).toBeTruthy();

    // Check optional badge
    const optionalBadge = container.querySelector('.progress-step__optional-badge');
    expect(optionalBadge).toBeTruthy();
    expect(optionalBadge?.textContent).toBe('Optional');
  });
});