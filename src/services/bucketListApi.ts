import { BucketItem, ApiResponse } from '../types';

/**
 * BucketListApi handles bucket list persistence, storage, and sharing functionality
 * Provides session storage, export capabilities, and cross-session persistence
 */
export class BucketListApi {
  private static readonly STORAGE_KEY = 'travel-bucket-list';
  private static readonly BACKUP_KEY = 'travel-bucket-list-backup';
  private static readonly VERSION_KEY = 'travel-bucket-list-version';
  private static readonly CURRENT_VERSION = '1.0';

  /**
   * Load bucket list from session storage
   */
  static loadBucketList(): BucketItem[] {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const data = JSON.parse(stored);
      
      // Validate data structure
      if (!Array.isArray(data)) {
        console.warn('Invalid bucket list data format, returning empty list');
        return [];
      }

      // Validate each item has required fields
      const validItems = data.filter(item => 
        item && 
        typeof item.id === 'string' &&
        typeof item.destination === 'string' &&
        Array.isArray(item.experiences) &&
        typeof item.estimatedDuration === 'number' &&
        item.costEstimate &&
        typeof item.priority === 'number'
      );

      if (validItems.length !== data.length) {
        console.warn(`Filtered out ${data.length - validItems.length} invalid bucket list items`);
      }

      return validItems;
    } catch (error) {
      console.error('Error loading bucket list from storage:', error);
      return this.loadBackup();
    }
  }

  /**
   * Save bucket list to session storage with backup
   */
  static saveBucketList(bucketList: BucketItem[]): boolean {
    try {
      // Create backup of current data before saving new data
      const currentData = sessionStorage.getItem(this.STORAGE_KEY);
      if (currentData) {
        sessionStorage.setItem(this.BACKUP_KEY, currentData);
      }

      // Save new data
      const dataToSave = JSON.stringify(bucketList);
      sessionStorage.setItem(this.STORAGE_KEY, dataToSave);
      sessionStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);
      
      // Verify save was successful
      const saved = sessionStorage.getItem(this.STORAGE_KEY);
      return saved === dataToSave;
    } catch (error) {
      console.error('Error saving bucket list to storage:', error);
      return false;
    }
  }

  /**
   * Load backup data if main storage fails
   */
  private static loadBackup(): BucketItem[] {
    try {
      const backup = sessionStorage.getItem(this.BACKUP_KEY);
      if (backup) {
        const data = JSON.parse(backup);
        if (Array.isArray(data)) {
          console.info('Loaded bucket list from backup');
          return data;
        }
      }
    } catch (error) {
      console.error('Error loading backup bucket list:', error);
    }
    return [];
  }

  /**
   * Add item to bucket list
   */
  static addItem(item: BucketItem): ApiResponse<BucketItem[]> {
    try {
      const currentList = this.loadBucketList();
      
      // Check for duplicate IDs
      if (currentList.some(existing => existing.id === item.id)) {
        return {
          success: false,
          error: {
            message: 'Item with this ID already exists',
            code: 'DUPLICATE_ID'
          }
        };
      }

      const updatedList = [...currentList, item];
      const saved = this.saveBucketList(updatedList);
      
      if (!saved) {
        return {
          success: false,
          error: {
            message: 'Failed to save bucket list',
            code: 'SAVE_FAILED'
          }
        };
      }

      return {
        success: true,
        data: updatedList
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          code: 'ADD_ITEM_ERROR'
        }
      };
    }
  }

  /**
   * Remove item from bucket list
   */
  static removeItem(itemId: string): ApiResponse<BucketItem[]> {
    try {
      const currentList = this.loadBucketList();
      const updatedList = currentList.filter(item => item.id !== itemId);
      
      if (updatedList.length === currentList.length) {
        return {
          success: false,
          error: {
            message: 'Item not found',
            code: 'ITEM_NOT_FOUND'
          }
        };
      }

      const saved = this.saveBucketList(updatedList);
      
      if (!saved) {
        return {
          success: false,
          error: {
            message: 'Failed to save bucket list',
            code: 'SAVE_FAILED'
          }
        };
      }

      return {
        success: true,
        data: updatedList
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          code: 'REMOVE_ITEM_ERROR'
        }
      };
    }
  }

  /**
   * Update item in bucket list
   */
  static updateItem(itemId: string, updates: Partial<BucketItem>): ApiResponse<BucketItem[]> {
    try {
      const currentList = this.loadBucketList();
      const itemIndex = currentList.findIndex(item => item.id === itemId);
      
      if (itemIndex === -1) {
        return {
          success: false,
          error: {
            message: 'Item not found',
            code: 'ITEM_NOT_FOUND'
          }
        };
      }

      const updatedList = [...currentList];
      updatedList[itemIndex] = { ...updatedList[itemIndex], ...updates };
      
      const saved = this.saveBucketList(updatedList);
      
      if (!saved) {
        return {
          success: false,
          error: {
            message: 'Failed to save bucket list',
            code: 'SAVE_FAILED'
          }
        };
      }

      return {
        success: true,
        data: updatedList
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          code: 'UPDATE_ITEM_ERROR'
        }
      };
    }
  }

  /**
   * Export bucket list as JSON file
   */
  static exportAsJSON(bucketList: BucketItem[], filename?: string): boolean {
    try {
      const exportData = {
        version: this.CURRENT_VERSION,
        exportDate: new Date().toISOString(),
        bucketList: bucketList,
        metadata: {
          totalItems: bucketList.length,
          totalDuration: bucketList.reduce((sum, item) => sum + item.estimatedDuration, 0),
          totalCostMin: bucketList.reduce((sum, item) => sum + item.costEstimate.min, 0),
          totalCostMax: bucketList.reduce((sum, item) => sum + item.costEstimate.max, 0),
          completedItems: bucketList.filter(item => item.status === 'completed').length
        }
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = filename || `travel-bucket-list-${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(link.href);
      return true;
    } catch (error) {
      console.error('Error exporting bucket list as JSON:', error);
      return false;
    }
  }

  /**
   * Export bucket list as CSV file
   */
  static exportAsCSV(bucketList: BucketItem[], filename?: string): boolean {
    try {
      const headers = [
        'Destination',
        'Experiences',
        'Duration (Days)',
        'Cost Min',
        'Cost Max',
        'Currency',
        'Priority',
        'Status',
        'Notes'
      ];

      const csvRows = [
        headers.join(','),
        ...bucketList.map(item => [
          `"${item.destination.replace(/"/g, '""')}"`,
          `"${item.experiences.join('; ').replace(/"/g, '""')}"`,
          item.estimatedDuration,
          item.costEstimate.min,
          item.costEstimate.max,
          item.costEstimate.currency,
          item.priority,
          item.status,
          `"${(item.notes || '').replace(/"/g, '""')}"`
        ].join(','))
      ];

      const csvContent = csvRows.join('\n');
      const dataBlob = new Blob([csvContent], { type: 'text/csv' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = filename || `travel-bucket-list-${new Date().toISOString().split('T')[0]}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(link.href);
      return true;
    } catch (error) {
      console.error('Error exporting bucket list as CSV:', error);
      return false;
    }
  }

  /**
   * Import bucket list from JSON file
   */
  static importFromJSON(file: File): Promise<ApiResponse<BucketItem[]>> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const importData = JSON.parse(content);
          
          // Validate import data structure
          if (!importData.bucketList || !Array.isArray(importData.bucketList)) {
            resolve({
              success: false,
              error: {
                message: 'Invalid file format: missing or invalid bucket list data',
                code: 'INVALID_FORMAT'
              }
            });
            return;
          }

          // Validate each item
          const validItems = importData.bucketList.filter((item: any) => 
            item && 
            typeof item.id === 'string' &&
            typeof item.destination === 'string' &&
            Array.isArray(item.experiences) &&
            typeof item.estimatedDuration === 'number' &&
            item.costEstimate &&
            typeof item.priority === 'number'
          );

          if (validItems.length === 0) {
            resolve({
              success: false,
              error: {
                message: 'No valid bucket list items found in file',
                code: 'NO_VALID_ITEMS'
              }
            });
            return;
          }

          // Merge with existing data (avoid duplicates)
          const currentList = this.loadBucketList();
          const existingIds = new Set(currentList.map(item => item.id));
          const newItems = validItems.filter((item: BucketItem) => !existingIds.has(item.id));
          
          const mergedList = [...currentList, ...newItems];
          const saved = this.saveBucketList(mergedList);
          
          if (!saved) {
            resolve({
              success: false,
              error: {
                message: 'Failed to save imported data',
                code: 'SAVE_FAILED'
              }
            });
            return;
          }

          resolve({
            success: true,
            data: mergedList
          });
        } catch (error) {
          resolve({
            success: false,
            error: {
              message: error instanceof Error ? error.message : 'Failed to parse file',
              code: 'PARSE_ERROR'
            }
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          error: {
            message: 'Failed to read file',
            code: 'READ_ERROR'
          }
        });
      };

      reader.readAsText(file);
    });
  }

  /**
   * Generate shareable link for bucket list
   */
  static generateShareableLink(bucketList: BucketItem[]): string {
    try {
      const shareData = {
        version: this.CURRENT_VERSION,
        bucketList: bucketList.map(item => ({
          destination: item.destination,
          experiences: item.experiences,
          estimatedDuration: item.estimatedDuration,
          priority: item.priority,
          status: item.status
        }))
      };

      const encodedData = btoa(JSON.stringify(shareData));
      const baseUrl = window.location.origin + window.location.pathname;
      return `${baseUrl}?shared=${encodedData}`;
    } catch (error) {
      console.error('Error generating shareable link:', error);
      return '';
    }
  }

  /**
   * Load bucket list from shareable link
   */
  static loadFromShareableLink(): BucketItem[] | null {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const sharedData = urlParams.get('shared');
      
      if (!sharedData) {
        return null;
      }

      const decodedData = JSON.parse(atob(sharedData));
      
      if (!decodedData.bucketList || !Array.isArray(decodedData.bucketList)) {
        return null;
      }

      // Convert shared data to full BucketItem format
      const bucketItems: BucketItem[] = decodedData.bucketList.map((item: any, index: number) => ({
        id: `shared-${Date.now()}-${index}`,
        destination: item.destination || 'Unknown Destination',
        experiences: Array.isArray(item.experiences) ? item.experiences : [],
        estimatedDuration: typeof item.estimatedDuration === 'number' ? item.estimatedDuration : 7,
        costEstimate: {
          min: 1000,
          max: 3000,
          currency: 'USD'
        },
        priority: typeof item.priority === 'number' ? item.priority : 3,
        status: item.status || 'planned',
        notes: 'Imported from shared link'
      }));

      return bucketItems;
    } catch (error) {
      console.error('Error loading from shareable link:', error);
      return null;
    }
  }

  /**
   * Copy shareable link to clipboard
   */
  static async copyShareableLink(bucketList: BucketItem[]): Promise<boolean> {
    try {
      const shareableLink = this.generateShareableLink(bucketList);
      
      if (!shareableLink) {
        return false;
      }

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareableLink);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareableLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const copied = document.execCommand('copy');
        document.body.removeChild(textArea);
        return copied;
      }
    } catch (error) {
      console.error('Error copying shareable link:', error);
      return false;
    }
  }

  /**
   * Clear all bucket list data
   */
  static clearAll(): boolean {
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
      sessionStorage.removeItem(this.BACKUP_KEY);
      sessionStorage.removeItem(this.VERSION_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing bucket list data:', error);
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  static getStorageStats(): {
    hasData: boolean;
    itemCount: number;
    storageSize: number;
    version: string;
    lastModified?: Date;
  } {
    try {
      const data = sessionStorage.getItem(this.STORAGE_KEY);
      const version = sessionStorage.getItem(this.VERSION_KEY) || 'unknown';
      
      if (!data) {
        return {
          hasData: false,
          itemCount: 0,
          storageSize: 0,
          version
        };
      }

      const bucketList = JSON.parse(data);
      const storageSize = new Blob([data]).size;

      return {
        hasData: true,
        itemCount: Array.isArray(bucketList) ? bucketList.length : 0,
        storageSize,
        version
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        hasData: false,
        itemCount: 0,
        storageSize: 0,
        version: 'error'
      };
    }
  }
}