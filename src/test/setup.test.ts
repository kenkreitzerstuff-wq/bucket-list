import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';

describe('Frontend Setup', () => {
  test('fast-check is properly configured', () => {
    // Simple property test to verify fast-check works
    fc.assert(
      fc.property(fc.string(), (s) => {
        return s.length >= 0;
      }),
      { numRuns: 100 }
    );
  });

  test('React testing environment is working', () => {
    expect(document).toBeDefined();
    expect(window).toBeDefined();
  });
});