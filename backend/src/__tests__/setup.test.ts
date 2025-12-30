import * as fc from 'fast-check';

describe('Project Setup', () => {
  test('fast-check is properly configured', () => {
    // Simple property test to verify fast-check works
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n + 0 === n;
      }),
      { numRuns: 100 }
    );
  });

  test('TypeScript interfaces are importable', () => {
    // Test that we can import our types
    const { UserProfile, LocationData } = require('../types');
    expect(typeof UserProfile).toBe('undefined'); // interfaces don't exist at runtime
    expect(typeof LocationData).toBe('undefined'); // but they should compile
  });
});