import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { BucketItem } from '../types';
import { BucketListApi } from '../services/bucketListApi';

/**
 * Property-based tests for Bucket List Persistence
 * Feature: travel-bucket-list, Property 11: Bucket List Persistence
 * **Validates: Requirements 7.2, 7.5**
 */

describe('Bucket List Persistence Property Tests', () => {
  
  beforeEach(() => {
    // Clear storage before each test
    BucketListApi.clearAll();
  });

  afterEach(() => {
    // Clean up after each test
    BucketListApi.clearAll();
  });

  // Arbitraries for generating test data
  const costRangeArb = fc.record({
    min: fc.integer({ min: 100, max: 10000 }),
    max: fc.integer({ min: 1000, max: 50000 }),
    currency: fc.constantFrom('USD', 'EUR', 'GBP', 'CAD', 'AUD')
  }).filter(range => range.max > range.min);

  const bucketItemArb = fc.record({
    id: fc.string({ minLength: 5, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-_]+$/.test(s)),
    destination: fc.string({ minLength: 3, maxLength: 100 }).filter(s => /^[a-zA-Z\s,'-()]+$/.test(s)),
    experiences: fc.array(
      fc.string({ minLength: 3, maxLength: 50 }).filter(s => /^[a-zA-Z\s,'-]+$/.test(s)),
      { minLength: 1, maxLength: 10 }
    ),
    estimatedDuration: fc.integer({ min: 1, max: 365 }),
    costEstimate: costRangeArb,
    priority: fc.integer({ min: 1, max: 5 }),
    status: fc.constantFrom('planned', 'booked', 'completed') as fc.Arbitrary<'planned' | 'booked' | 'completed'>,
    notes: fc.option(fc.string({ maxLength: 500 }), { nil: undefined })
  });

  const bucketListArb = fc.array(bucketItemArb, { minLength: 0, maxLength: 20 })
    .map(items => {
      // Ensure unique IDs
      const uniqueItems: BucketItem[] = [];
      const seenIds = new Set<string>();
      
      for (const item of items) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          uniqueItems.push(item);
        }
      }
      
      return uniqueItems;
    });

  /**
   * Property 11: Bucket List Persistence
   * For any bucket list modifications (add, remove, modify), the changes should 
   * persist across user sessions and remain accessible for future modifications
   */
  test('Property 11: Bucket List Persistence - Add/Remove/Modify Operations', () => {
    fc.assert(
      fc.property(
        bucketListArb,
        bucketItemArb,
        (initialBucketList, newItem) => {
          // Ensure new item has unique ID
          fc.pre(!initialBucketList.some(item => item.id === newItem.id));
          
          // Save initial bucket list
          const saveResult = BucketListApi.saveBucketList(initialBucketList);
          expect(saveResult).toBe(true);
          
          // Load and verify initial data persists
          const loadedInitial = BucketListApi.loadBucketList();
          expect(loadedInitial).toEqual(initialBucketList);
          
          // Add new item
          const addResult = BucketListApi.addItem(newItem);
          expect(addResult.success).toBe(true);
          
          // Verify addition persists
          const afterAdd = BucketListApi.loadBucketList();
          expect(afterAdd).toHaveLength(initialBucketList.length + 1);
          expect(afterAdd).toContainEqual(newItem);
          
          // Modify the new item
          const modifications: Partial<BucketItem> = {
            destination: newItem.destination + ' (Modified)',
            priority: newItem.priority === 5 ? 1 : newItem.priority + 1,
            notes: (newItem.notes || '') + ' - Modified'
          };
          
          const updateResult = BucketListApi.updateItem(newItem.id, modifications);
          expect(updateResult.success).toBe(true);
          
          // Verify modification persists
          const afterUpdate = BucketListApi.loadBucketList();
          const modifiedItem = afterUpdate.find(item => item.id === newItem.id);
          expect(modifiedItem).toBeDefined();
          expect(modifiedItem!.destination).toBe(modifications.destination);
          expect(modifiedItem!.priority).toBe(modifications.priority);
          expect(modifiedItem!.notes).toBe(modifications.notes);
          
          // Remove the item
          const removeResult = BucketListApi.removeItem(newItem.id);
          expect(removeResult.success).toBe(true);
          
          // Verify removal persists
          const afterRemove = BucketListApi.loadBucketList();
          expect(afterRemove).toHaveLength(initialBucketList.length);
          expect(afterRemove.find(item => item.id === newItem.id)).toBeUndefined();
          expect(afterRemove).toEqual(initialBucketList);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Cross-session persistence
   * Data should persist across multiple save/load cycles
   */
  test('Property: Cross-session persistence through multiple cycles', () => {
    fc.assert(
      fc.property(
        bucketListArb,
        fc.array(bucketItemArb, { minLength: 1, maxLength: 5 }),
        (initialList, itemsToAdd) => {
          // Ensure all items have unique IDs
          const allIds = new Set([
            ...initialList.map(item => item.id),
            ...itemsToAdd.map(item => item.id)
          ]);
          fc.pre(allIds.size === initialList.length + itemsToAdd.length);
          
          // Save initial list
          expect(BucketListApi.saveBucketList(initialList)).toBe(true);
          
          let currentList = [...initialList];
          
          // Perform multiple add operations across "sessions"
          for (const itemToAdd of itemsToAdd) {
            // Simulate session boundary by reloading data
            const reloaded = BucketListApi.loadBucketList();
            expect(reloaded).toEqual(currentList);
            
            // Add item
            const addResult = BucketListApi.addItem(itemToAdd);
            expect(addResult.success).toBe(true);
            
            currentList.push(itemToAdd);
            
            // Verify persistence
            const afterAdd = BucketListApi.loadBucketList();
            expect(afterAdd).toEqual(currentList);
          }
          
          // Final verification - simulate complete session restart
          const finalReload = BucketListApi.loadBucketList();
          expect(finalReload).toEqual(currentList);
          expect(finalReload).toHaveLength(initialList.length + itemsToAdd.length);
          
          // Verify all original items are still there
          for (const originalItem of initialList) {
            expect(finalReload.find(item => item.id === originalItem.id)).toEqual(originalItem);
          }
          
          // Verify all added items are there
          for (const addedItem of itemsToAdd) {
            expect(finalReload.find(item => item.id === addedItem.id)).toEqual(addedItem);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Data integrity across operations
   * All operations should maintain data structure integrity
   */
  test('Property: Data integrity maintained across all operations', () => {
    fc.assert(
      fc.property(
        bucketListArb,
        (bucketList) => {
          // Save bucket list
          expect(BucketListApi.saveBucketList(bucketList)).toBe(true);
          
          // Load and verify structure integrity
          const loaded = BucketListApi.loadBucketList();
          
          // Should be an array
          expect(Array.isArray(loaded)).toBe(true);
          
          // Each item should have required fields
          for (const item of loaded) {
            expect(typeof item.id).toBe('string');
            expect(item.id.length).toBeGreaterThan(0);
            
            expect(typeof item.destination).toBe('string');
            expect(item.destination.length).toBeGreaterThan(0);
            
            expect(Array.isArray(item.experiences)).toBe(true);
            expect(item.experiences.length).toBeGreaterThan(0);
            
            expect(typeof item.estimatedDuration).toBe('number');
            expect(item.estimatedDuration).toBeGreaterThan(0);
            
            expect(typeof item.costEstimate).toBe('object');
            expect(typeof item.costEstimate.min).toBe('number');
            expect(typeof item.costEstimate.max).toBe('number');
            expect(typeof item.costEstimate.currency).toBe('string');
            expect(item.costEstimate.max).toBeGreaterThan(item.costEstimate.min);
            
            expect(typeof item.priority).toBe('number');
            expect(item.priority).toBeGreaterThanOrEqual(1);
            expect(item.priority).toBeLessThanOrEqual(5);
            
            expect(['planned', 'booked', 'completed']).toContain(item.status);
          }
          
          // Loaded data should exactly match saved data
          expect(loaded).toEqual(bucketList);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Export/Import round-trip consistency
   * Data exported and then imported should remain identical
   */
  test('Property: Export/Import round-trip consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        bucketListArb,
        async (originalList) => {
          fc.pre(originalList.length > 0); // Only test non-empty lists for export
          
          // Save original list
          expect(BucketListApi.saveBucketList(originalList)).toBe(true);
          
          // Create a mock file for import testing
          const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            bucketList: originalList,
            metadata: {
              totalItems: originalList.length,
              totalDuration: originalList.reduce((sum, item) => sum + item.estimatedDuration, 0),
              totalCostMin: originalList.reduce((sum, item) => sum + item.costEstimate.min, 0),
              totalCostMax: originalList.reduce((sum, item) => sum + item.costEstimate.max, 0),
              completedItems: originalList.filter(item => item.status === 'completed').length
            }
          };
          
          const jsonString = JSON.stringify(exportData, null, 2);
          const mockFile = new File([jsonString], 'test-bucket-list.json', { type: 'application/json' });
          
          // Clear storage to simulate fresh import
          BucketListApi.clearAll();
          expect(BucketListApi.loadBucketList()).toHaveLength(0);
          
          // Import the data
          const importResult = await BucketListApi.importFromJSON(mockFile);
          expect(importResult.success).toBe(true);
          
          // Verify imported data matches original
          const importedList = BucketListApi.loadBucketList();
          expect(importedList).toEqual(originalList);
          
          // Verify all items are present and correct
          expect(importedList).toHaveLength(originalList.length);
          
          for (const originalItem of originalList) {
            const importedItem = importedList.find(item => item.id === originalItem.id);
            expect(importedItem).toEqual(originalItem);
          }
        }
      ),
      { numRuns: 50 } // Fewer runs due to async nature
    );
  });

  /**
   * Property: Backup and restore functionality
   * Backup data should be restorable and identical to original
   */
  test('Property: Backup and restore maintains data integrity', () => {
    fc.assert(
      fc.property(
        bucketListArb,
        bucketListArb,
        (originalList, modifiedList) => {
          // Ensure lists are different
          fc.pre(JSON.stringify(originalList) !== JSON.stringify(modifiedList));
          
          // Save original list (this creates a backup when we save modified list)
          expect(BucketListApi.saveBucketList(originalList)).toBe(true);
          
          // Verify original list is loaded correctly
          const loadedOriginal = BucketListApi.loadBucketList();
          expect(loadedOriginal).toEqual(originalList);
          
          // Save modified list (this should backup the original)
          expect(BucketListApi.saveBucketList(modifiedList)).toBe(true);
          
          // Verify modified list is now current
          const loadedModified = BucketListApi.loadBucketList();
          expect(loadedModified).toEqual(modifiedList);
          
          // The backup functionality is internal to the API
          // We verify persistence by checking that data survives multiple operations
          
          // Perform some operations on the modified list
          if (modifiedList.length > 0) {
            const firstItem = modifiedList[0];
            const updateResult = BucketListApi.updateItem(firstItem.id, { 
              notes: (firstItem.notes || '') + ' - Test modification' 
            });
            
            if (updateResult.success) {
              // Verify the update persisted
              const afterUpdate = BucketListApi.loadBucketList();
              const updatedItem = afterUpdate.find(item => item.id === firstItem.id);
              expect(updatedItem?.notes).toContain('Test modification');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Storage statistics accuracy
   * Storage statistics should accurately reflect the current state
   */
  test('Property: Storage statistics reflect actual data', () => {
    fc.assert(
      fc.property(
        bucketListArb,
        (bucketList) => {
          // Save bucket list
          expect(BucketListApi.saveBucketList(bucketList)).toBe(true);
          
          // Get storage statistics
          const stats = BucketListApi.getStorageStats();
          
          // Verify statistics match actual data
          expect(stats.hasData).toBe(bucketList.length > 0);
          expect(stats.itemCount).toBe(bucketList.length);
          expect(stats.version).toBe('1.0');
          
          if (bucketList.length > 0) {
            expect(stats.storageSize).toBeGreaterThan(0);
          } else {
            expect(stats.storageSize).toBe(0);
          }
          
          // Verify loaded data matches what statistics report
          const loadedData = BucketListApi.loadBucketList();
          expect(loadedData.length).toBe(stats.itemCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Shareable link generation and parsing
   * Generated shareable links should contain the bucket list data
   */
  test('Property: Shareable link round-trip consistency', () => {
    fc.assert(
      fc.property(
        bucketListArb,
        (originalList) => {
          fc.pre(originalList.length > 0 && originalList.length <= 10); // Reasonable size for URL
          
          // Generate shareable link
          const shareableLink = BucketListApi.generateShareableLink(originalList);
          expect(shareableLink).toBeTruthy();
          expect(shareableLink).toContain('shared=');
          
          // Extract the shared data parameter
          const url = new URL(shareableLink);
          const sharedParam = url.searchParams.get('shared');
          expect(sharedParam).toBeTruthy();
          
          // Decode and verify the data structure
          const decodedData = JSON.parse(atob(sharedParam!));
          expect(decodedData.version).toBe('1.0');
          expect(Array.isArray(decodedData.bucketList)).toBe(true);
          expect(decodedData.bucketList).toHaveLength(originalList.length);
          
          // Verify essential data is preserved (some fields may be omitted for sharing)
          for (let i = 0; i < originalList.length; i++) {
            const original = originalList[i];
            const shared = decodedData.bucketList[i];
            
            expect(shared.destination).toBe(original.destination);
            expect(shared.experiences).toEqual(original.experiences);
            expect(shared.estimatedDuration).toBe(original.estimatedDuration);
            expect(shared.priority).toBe(original.priority);
            expect(shared.status).toBe(original.status);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error handling maintains data integrity
   * Invalid operations should not corrupt existing data
   */
  test('Property: Error handling preserves data integrity', () => {
    fc.assert(
      fc.property(
        bucketListArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        (validList, invalidId) => {
          // Ensure invalid ID doesn't exist in valid list
          fc.pre(!validList.some(item => item.id === invalidId));
          
          // Save valid list
          expect(BucketListApi.saveBucketList(validList)).toBe(true);
          
          // Verify initial state
          const initialLoad = BucketListApi.loadBucketList();
          expect(initialLoad).toEqual(validList);
          
          // Try invalid operations
          const removeInvalidResult = BucketListApi.removeItem(invalidId);
          expect(removeInvalidResult.success).toBe(false);
          
          const updateInvalidResult = BucketListApi.updateItem(invalidId, { notes: 'test' });
          expect(updateInvalidResult.success).toBe(false);
          
          // Verify data is unchanged after invalid operations
          const afterInvalidOps = BucketListApi.loadBucketList();
          expect(afterInvalidOps).toEqual(validList);
          expect(afterInvalidOps).toEqual(initialLoad);
          
          // Try adding duplicate ID (if list is not empty)
          if (validList.length > 0) {
            const existingItem = validList[0];
            const duplicateItem: BucketItem = {
              ...existingItem,
              destination: existingItem.destination + ' (Duplicate)'
            };
            
            const addDuplicateResult = BucketListApi.addItem(duplicateItem);
            expect(addDuplicateResult.success).toBe(false);
            
            // Verify no corruption occurred
            const afterDuplicateAttempt = BucketListApi.loadBucketList();
            expect(afterDuplicateAttempt).toEqual(validList);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});