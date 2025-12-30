import { BucketItem, LocationData } from '../types';
/**
 * BucketListDataService manages Ken and Gail's original travel bucket list data
 * This serves as the core data source for personalized recommendations
 */
export declare class BucketListDataService {
    /**
     * Ken and Gail's original bucket list data from CSV
     */
    private static readonly ORIGINAL_BUCKET_LIST;
    /**
     * Gets all bucket list items
     */
    static getAllBucketListItems(): any[];
    /**
     * Gets incomplete bucket list items (not done yet)
     */
    static getIncompleteBucketListItems(): any[];
    /**
     * Gets completed bucket list items
     */
    static getCompletedBucketListItems(): any[];
    /**
     * Gets high priority items (Ken's priority 1-2 or Gail's HIGH interest)
     */
    static getHighPriorityItems(): any[];
    /**
     * Gets items by priority level
     */
    static getItemsByPriority(priority: number): any[];
    /**
     * Gets items by Gail's interest level
     */
    static getItemsByGailInterest(level: 'HIGH' | 'LOW'): any[];
    /**
     * Gets items by tags/interests
     */
    static getItemsByTags(tags: string[]): any[];
    /**
     * Gets items by difficulty level
     */
    static getItemsByDifficulty(difficulty: 'easy' | 'moderate' | 'challenging'): any[];
    /**
     * Gets items suitable for a given duration
     */
    static getItemsByDuration(minDays: number, maxDays: number): any[];
    /**
     * Gets items suitable for current season
     */
    static getItemsForSeason(month: number): any[];
    /**
     * Searches items by destination name or experiences
     */
    static searchItems(query: string): any[];
    /**
     * Gets recommended items based on user preferences
     */
    static getRecommendedItems(preferences: {
        interests?: string[];
        travelStyle?: string;
        difficulty?: string;
        duration?: string;
        prioritizeGailInterest?: boolean;
    }): any[];
    /**
     * Converts bucket list item to standard BucketItem format
     */
    static toBucketItem(item: any, homeLocation?: LocationData): BucketItem;
    /**
     * Estimates cost for a bucket list item
     */
    private static estimateCost;
    /**
     * Gets season from month number
     */
    private static getSeasonFromMonth;
    /**
     * Gets travel company recommendations from the original data
     */
    static getTravelCompanyRecommendations(): string[];
}
//# sourceMappingURL=BucketListDataService.d.ts.map