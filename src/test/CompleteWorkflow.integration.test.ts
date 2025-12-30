import { describe, test, expect, beforeEach } from 'vitest';
import { LocationService, UserProfileStorage } from '../../../backend/src/services/LocationService';
import { TravelInputService } from '../../../backend/src/services/TravelInputService';
import { RecommendationEngine } from '../../../backend/src/services/RecommendationEngine';
import { BucketListApi } from '../services/bucketListApi';
import { TravelInputData, UserProfile, BucketItem } from '../types';

/**
 * Integration tests for the complete travel bucket list workflow
 * Tests the full user journey from input to final bucket list
 */
describe('Complete Workflow Integration Tests', () => {
  const testUserId = 'test-user-complete-workflow';

  beforeEach(() => {
    // Clear all storage before each test
    localStorage.clear();
    sessionStorage.clear();
    BucketListApi.clearAll();
  });

  test('Complete user journey: Home location → Travel input → Recommendations → Bucket list', async () => {
    // Step 1: Set home location
    const homeLocationInput = 'San Francisco, California, USA';
    const locationValidation = LocationService.validateLocation(homeLocationInput);
    expect(locationValidation.isValid).toBe(true);

    const locationData = await LocationService.parseLocationData(homeLocationInput);
    expect(locationData.city).toBe('San Francisco');
    expect(locationData.country).toBe('United States');

    UserProfileStorage.storeHomeLocation(testUserId, locationData);

    // Step 2: Create comprehensive travel input
    const travelInput: TravelInputData = {
      destinations: ['Tokyo, Japan', 'Kyoto, Japan', 'Osaka, Japan'],
      experiences: ['Visit traditional temples', 'Try authentic ramen', 'Experience cherry blossoms', 'Stay in a ryokan'],
      preferences: {
        budgetRange: { min: 3000, max: 8000, currency: 'USD' },
        travelStyle: 'mid-range',
        interests: ['culture', 'food', 'nature', 'history'],
        travelDuration: 'medium',
        groupSize: 2
      },
      timeframe: {
        flexibility: 'flexible',
        preferredMonths: [3, 4, 5] // March, April, May as numbers
      }
    };

    // Step 3: Validate and store travel input
    const validation = TravelInputService.validateTravelInput(travelInput);
    expect(validation.isValid).toBe(true);

    const completenessScore = TravelInputService.calculateCompletenessScore(travelInput);
    expect(completenessScore).toBeGreaterThan(80);

    TravelInputService.storeTravelInput(testUserId, travelInput);

    // Step 4: Create user profile for recommendations
    const userProfile: UserProfile = {
      id: testUserId,
      homeLocation: locationData,
      preferences: travelInput.preferences || {},
      bucketList: []
    };

    // Step 5: Generate recommendations
    const recommendations = await RecommendationEngine.generateRecommendations(userProfile, travelInput);
    expect(recommendations).toBeDefined();
    expect(recommendations.length).toBeGreaterThan(0);

    // Verify recommendations have required properties
    recommendations.forEach(rec => {
      expect(rec.title).toBeDefined();
      expect(rec.description).toBeDefined();
      expect(rec.reasoning).toBeDefined();
      expect(rec.confidence).toBeGreaterThan(0);
      expect(rec.confidence).toBeLessThanOrEqual(1);
      expect(['destination', 'experience']).toContain(rec.type);
    });

    // Step 6: Accept some recommendations and add to bucket list
    const acceptedRecommendations = recommendations.slice(0, 3);
    const bucketItems: BucketItem[] = acceptedRecommendations.map((rec, index) => ({
      id: `rec-${Date.now()}-${index}`,
      destination: rec.title,
      experiences: rec.relatedTo,
      estimatedDuration: rec.metadata?.duration || 7,
      costEstimate: {
        min: 1500,
        max: 4000,
        currency: 'USD'
      },
      priority: Math.ceil((1 - rec.confidence) * 5),
      status: 'planned',
      notes: `Added from AI recommendation: ${rec.reasoning}`
    }));

    // Step 7: Add items to bucket list
    for (const item of bucketItems) {
      const result = BucketListApi.addItem(item);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    }

    // Step 8: Verify bucket list persistence
    const savedBucketList = BucketListApi.loadBucketList();
    expect(savedBucketList.length).toBe(bucketItems.length);

    // Verify each item was saved correctly
    bucketItems.forEach(originalItem => {
      const savedItem = savedBucketList.find(item => item.id === originalItem.id);
      expect(savedItem).toBeDefined();
      expect(savedItem!.destination).toBe(originalItem.destination);
      expect(savedItem!.experiences).toEqual(originalItem.experiences);
      expect(savedItem!.priority).toBe(originalItem.priority);
    });

    // Step 9: Test bucket list operations
    const firstItem = savedBucketList[0];
    
    // Update an item
    const updateResult = BucketListApi.updateItem(firstItem.id, {
      priority: 1,
      notes: 'Updated priority to highest'
    });
    expect(updateResult.success).toBe(true);

    const updatedList = BucketListApi.loadBucketList();
    const updatedItem = updatedList.find(item => item.id === firstItem.id);
    expect(updatedItem!.priority).toBe(1);
    expect(updatedItem!.notes).toBe('Updated priority to highest');

    // Remove an item
    const removeResult = BucketListApi.removeItem(firstItem.id);
    expect(removeResult.success).toBe(true);

    const finalList = BucketListApi.loadBucketList();
    expect(finalList.length).toBe(bucketItems.length - 1);
    expect(finalList.find(item => item.id === firstItem.id)).toBeUndefined();
  });

  test('Error recovery and fallback scenarios', async () => {
    // Test with invalid home location
    const invalidLocation = 'Invalid Location That Does Not Exist';
    const locationValidation = LocationService.validateLocation(invalidLocation);
    expect(locationValidation.isValid).toBe(false);

    // Should handle gracefully without crashing
    expect(() => {
      UserProfileStorage.storeHomeLocation(testUserId, {
        city: 'Unknown',
        country: 'Unknown',
        coordinates: { lat: 0, lng: 0 }
      });
    }).not.toThrow();

    // Test with incomplete travel input
    const incompleteInput: TravelInputData = {
      destinations: ['Somewhere'],
      experiences: []
    };

    const validation = TravelInputService.validateTravelInput(incompleteInput);
    expect(validation.isValid).toBe(false);

    // Should still be able to store and retrieve
    TravelInputService.storeTravelInput(testUserId, incompleteInput);
    const retrieved = TravelInputService.getTravelInput(testUserId);
    expect(retrieved).toBeDefined();

    // Test bucket list with corrupted data
    const corruptedItem: any = {
      id: 'corrupted',
      destination: null, // Invalid
      experiences: 'not an array', // Invalid
      estimatedDuration: 'not a number' // Invalid
    };

    // Should handle corrupted data gracefully
    const addResult = BucketListApi.addItem(corruptedItem);
    expect(addResult.success).toBe(false);
    expect(addResult.error).toBeDefined();
  });

  test('Data persistence across sessions', async () => {
    // Set up initial data
    const homeLocation = await LocationService.parseLocationData('London, UK');
    UserProfileStorage.storeHomeLocation(testUserId, homeLocation);

    const travelInput: TravelInputData = {
      destinations: ['Paris', 'Rome'],
      experiences: ['Museums', 'Food tours'],
      preferences: {
        budgetRange: { min: 2000, max: 5000, currency: 'EUR' },
        travelStyle: 'luxury',
        interests: ['art', 'cuisine'],
        travelDuration: 'short',
        groupSize: 2
      }
    };

    TravelInputService.storeTravelInput(testUserId, travelInput);

    const bucketItem: BucketItem = {
      id: 'persistence-test',
      destination: 'Paris, France',
      experiences: ['Visit Louvre', 'Eiffel Tower'],
      estimatedDuration: 5,
      costEstimate: { min: 1500, max: 3000, currency: 'EUR' },
      priority: 2,
      status: 'planned',
      notes: 'Persistence test item'
    };

    BucketListApi.addItem(bucketItem);

    // Simulate session restart by clearing in-memory state
    // (In a real app, this would be a page refresh)
    
    // Verify data persists
    const retrievedLocation = UserProfileStorage.getHomeLocation(testUserId);
    expect(retrievedLocation).toEqual(homeLocation);

    const retrievedInput = TravelInputService.getTravelInput(testUserId);
    expect(retrievedInput).toEqual(travelInput);

    const retrievedBucketList = BucketListApi.loadBucketList();
    expect(retrievedBucketList.length).toBe(1);
    expect(retrievedBucketList[0]).toEqual(bucketItem);
  });

  test('Multiple user isolation and data integrity', async () => {
    const user1Id = 'user1-isolation-test';
    const user2Id = 'user2-isolation-test';

    // Set up different data for each user
    const location1 = await LocationService.parseLocationData('New York, USA');
    const location2 = await LocationService.parseLocationData('Sydney, Australia');

    UserProfileStorage.storeHomeLocation(user1Id, location1);
    UserProfileStorage.storeHomeLocation(user2Id, location2);

    const input1: TravelInputData = {
      destinations: ['Europe destinations'],
      experiences: ['European experiences']
    };

    const input2: TravelInputData = {
      destinations: ['Asian destinations'],
      experiences: ['Asian experiences']
    };

    TravelInputService.storeTravelInput(user1Id, input1);
    TravelInputService.storeTravelInput(user2Id, input2);

    // Note: BucketListApi uses session storage which is global,
    // but in a real app this would be user-specific
    const item1: BucketItem = {
      id: 'user1-item',
      destination: 'Paris',
      experiences: ['Art'],
      estimatedDuration: 3,
      costEstimate: { min: 1000, max: 2000, currency: 'USD' },
      priority: 1,
      status: 'planned'
    };

    const item2: BucketItem = {
      id: 'user2-item',
      destination: 'Tokyo',
      experiences: ['Culture'],
      estimatedDuration: 5,
      costEstimate: { min: 1500, max: 3000, currency: 'USD' },
      priority: 2,
      status: 'planned'
    };

    BucketListApi.addItem(item1);
    BucketListApi.addItem(item2);

    // Verify isolation
    const retrievedLocation1 = UserProfileStorage.getHomeLocation(user1Id);
    const retrievedLocation2 = UserProfileStorage.getHomeLocation(user2Id);
    const retrievedInput1 = TravelInputService.getTravelInput(user1Id);
    const retrievedInput2 = TravelInputService.getTravelInput(user2Id);

    expect(retrievedLocation1).toEqual(location1);
    expect(retrievedLocation2).toEqual(location2);
    expect(retrievedInput1).toEqual(input1);
    expect(retrievedInput2).toEqual(input2);

    // Verify they don't interfere with each other
    expect(retrievedLocation1).not.toEqual(retrievedLocation2);
    expect(retrievedInput1).not.toEqual(retrievedInput2);
  });

  test('Export and import functionality', async () => {
    // Create test bucket list
    const testItems: BucketItem[] = [
      {
        id: 'export-test-1',
        destination: 'Barcelona, Spain',
        experiences: ['Sagrada Familia', 'Park Güell', 'Tapas tours'],
        estimatedDuration: 4,
        costEstimate: { min: 1200, max: 2500, currency: 'EUR' },
        priority: 1,
        status: 'planned',
        notes: 'Spring trip'
      },
      {
        id: 'export-test-2',
        destination: 'Reykjavik, Iceland',
        experiences: ['Northern Lights', 'Blue Lagoon', 'Golden Circle'],
        estimatedDuration: 6,
        costEstimate: { min: 2000, max: 4000, currency: 'USD' },
        priority: 2,
        status: 'booked',
        notes: 'Winter adventure'
      }
    ];

    // Add items to bucket list
    for (const item of testItems) {
      const result = BucketListApi.addItem(item);
      expect(result.success).toBe(true);
    }

    // Test shareable link generation
    const shareableLink = BucketListApi.generateShareableLink(testItems);
    expect(shareableLink).toBeDefined();
    expect(shareableLink.length).toBeGreaterThan(0);
    expect(shareableLink).toContain('shared=');

    // Test loading from shareable link (simulate URL parameter)
    const url = new URL(shareableLink);
    const sharedParam = url.searchParams.get('shared');
    expect(sharedParam).toBeDefined();

    // Mock window.location.search for the test
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, search: `?shared=${sharedParam}` },
      writable: true
    });

    const loadedItems = BucketListApi.loadFromShareableLink();
    expect(loadedItems).toBeDefined();
    expect(loadedItems!.length).toBe(testItems.length);

    // Verify loaded items have correct data
    loadedItems!.forEach((loadedItem, index) => {
      expect(loadedItem.destination).toBe(testItems[index].destination);
      expect(loadedItem.experiences).toEqual(testItems[index].experiences);
      expect(loadedItem.estimatedDuration).toBe(testItems[index].estimatedDuration);
    });

    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true
    });
  });

  test('Recommendation quality and relevance', async () => {
    // Set up user profile with specific preferences
    const homeLocation = await LocationService.parseLocationData('Denver, Colorado, USA');
    const userProfile: UserProfile = {
      id: testUserId,
      homeLocation,
      preferences: {
        budgetRange: { min: 2000, max: 6000, currency: 'USD' },
        travelStyle: 'adventure',
        interests: ['hiking', 'mountains', 'nature'],
        travelDuration: 'long',
        groupSize: 2
      },
      bucketList: []
    };

    const travelInput: TravelInputData = {
      destinations: ['Patagonia', 'Nepal', 'New Zealand'],
      experiences: ['Mountain climbing', 'Trekking', 'Wildlife viewing'],
      preferences: userProfile.preferences
    };

    // Generate recommendations
    const recommendations = await RecommendationEngine.generateRecommendations(userProfile, travelInput);
    expect(recommendations.length).toBeGreaterThan(0);

    // Verify recommendation quality
    recommendations.forEach(rec => {
      // Should have high confidence for well-matched preferences
      if (rec.relatedTo.some(tag => ['hiking', 'mountains', 'nature', 'adventure'].includes(tag.toLowerCase()))) {
        expect(rec.confidence).toBeGreaterThan(0.6);
      }

      // Should have proper structure
      expect(rec.title).toBeDefined();
      expect(rec.title.length).toBeGreaterThan(0);
      expect(rec.description).toBeDefined();
      expect(rec.description.length).toBeGreaterThan(10);
      expect(rec.reasoning).toBeDefined();
      expect(rec.reasoning.length).toBeGreaterThan(10);

      // Should be relevant to input
      const isRelevant = 
        rec.relatedTo.some(tag => 
          travelInput.destinations.some(dest => 
            dest.toLowerCase().includes(tag.toLowerCase()) ||
            tag.toLowerCase().includes(dest.toLowerCase())
          )
        ) ||
        rec.relatedTo.some(tag =>
          travelInput.experiences.some(exp =>
            exp.toLowerCase().includes(tag.toLowerCase()) ||
            tag.toLowerCase().includes(exp.toLowerCase())
          )
        ) ||
        userProfile.preferences.interests?.some(interest =>
          rec.relatedTo.some(tag =>
            tag.toLowerCase().includes(interest.toLowerCase()) ||
            interest.toLowerCase().includes(tag.toLowerCase())
          )
        );

      expect(isRelevant).toBe(true);
    });
  });

  test('System performance under load', async () => {
    const startTime = Date.now();

    // Create multiple users with data
    const userCount = 10;
    const promises = [];

    for (let i = 0; i < userCount; i++) {
      const userId = `load-test-user-${i}`;
      
      promises.push((async () => {
        // Set home location
        const location = await LocationService.parseLocationData(`City${i}, Country${i}`);
        UserProfileStorage.storeHomeLocation(userId, location);

        // Create travel input
        const travelInput: TravelInputData = {
          destinations: [`Destination${i}A`, `Destination${i}B`],
          experiences: [`Experience${i}A`, `Experience${i}B`],
          preferences: {
            budgetRange: { min: 1000 + i * 100, max: 5000 + i * 100, currency: 'USD' },
            travelStyle: i % 2 === 0 ? 'budget' : 'luxury',
            interests: [`interest${i}`],
            travelDuration: 'medium',
            groupSize: i % 4 + 1
          }
        };

        TravelInputService.storeTravelInput(userId, travelInput);

        // Add bucket list items
        for (let j = 0; j < 3; j++) {
          const item: BucketItem = {
            id: `load-test-${i}-${j}`,
            destination: `Destination${i}-${j}`,
            experiences: [`Experience${i}-${j}`],
            estimatedDuration: j + 3,
            costEstimate: { min: 1000, max: 3000, currency: 'USD' },
            priority: j + 1,
            status: 'planned'
          };

          BucketListApi.addItem(item);
        }
      })());
    }

    // Wait for all operations to complete
    await Promise.all(promises);

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Should complete within reasonable time (adjust threshold as needed)
    expect(totalTime).toBeLessThan(5000); // 5 seconds

    // Verify all data was stored correctly
    for (let i = 0; i < userCount; i++) {
      const userId = `load-test-user-${i}`;
      const location = UserProfileStorage.getHomeLocation(userId);
      const input = TravelInputService.getTravelInput(userId);

      expect(location).toBeDefined();
      expect(location!.city).toBe(`City${i}`);
      expect(input).toBeDefined();
      expect(input!.destinations).toContain(`Destination${i}A`);
    }

    // Verify bucket list contains all items
    const bucketList = BucketListApi.loadBucketList();
    expect(bucketList.length).toBe(userCount * 3);
  });
});

// Mock sessionStorage for Node.js environment
const sessionStorageMock = (() => {
  let store: { [key: string]: string } = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
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

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.location for shareable link tests
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    href: 'http://localhost:3000/'
  },
  writable: true
});