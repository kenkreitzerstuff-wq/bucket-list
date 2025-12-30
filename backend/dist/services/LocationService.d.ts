import { LocationData, ValidationResult } from '../types';
/**
 * LocationService handles validation, normalization, and storage of location data
 * Supports multiple input formats: city/country, airport codes, postal codes
 */
export declare class LocationService {
    private static readonly AIRPORT_CODE_REGEX;
    private static readonly POSTAL_CODE_PATTERNS;
    /**
     * Validates location input in various formats
     */
    static validateLocation(input: string): ValidationResult;
    /**
     * Validates airport code format
     */
    private static validateAirportCode;
    /**
     * Validates postal code format for various countries
     */
    private static validatePostalCode;
    /**
     * Validates city/country format
     */
    private static validateCityCountry;
    /**
     * Normalizes location input into a consistent format
     */
    static normalizeLocation(input: string): string;
    /**
     * Converts location input to LocationData structure
     * In a real implementation, this would call external APIs for geocoding
     */
    static parseLocationData(input: string): Promise<LocationData>;
    /**
     * Parse airport code into LocationData
     */
    private static parseAirportCode;
    /**
     * Parse city/country into LocationData
     */
    private static parseCityCountry;
    /**
     * Parse single location into LocationData
     */
    private static parseSingleLocation;
    /**
     * Generate mock coordinates for testing
     */
    private static getMockCoordinates;
    /**
     * Guess airport code based on city/country
     */
    private static guessAirportCode;
}
/**
 * UserProfileStorage handles storing and retrieving user location data
 */
export declare class UserProfileStorage {
    private static readonly STORAGE_KEY;
    /**
     * Store user's home location
     */
    static storeHomeLocation(userId: string, location: LocationData): void;
    /**
     * Retrieve user's home location
     */
    static getHomeLocation(userId: string): LocationData | null;
    /**
     * Get complete user profile
     */
    static getUserProfile(userId: string): any;
    /**
     * Save complete user profile
     */
    static saveUserProfile(userId: string, profile: any): void;
    /**
     * Clear user profile
     */
    static clearUserProfile(userId: string): void;
}
//# sourceMappingURL=LocationService.d.ts.map