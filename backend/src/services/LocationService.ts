import { LocationData, ValidationResult } from '../types';

/**
 * LocationService handles validation, normalization, and storage of location data
 * Supports multiple input formats: city/country, airport codes, postal codes
 */
export class LocationService {
  private static readonly AIRPORT_CODE_REGEX = /^[A-Z]{3}$/;
  private static readonly POSTAL_CODE_PATTERNS = {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Z]\d[A-Z] \d[A-Z]\d$/,
    UK: /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/,
    DE: /^\d{5}$/,
    FR: /^\d{5}$/,
  };

  /**
   * Validates location input in various formats
   */
  public static validateLocation(input: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input || input.trim().length === 0) {
      errors.push('Location input cannot be empty');
      return { isValid: false, errors, warnings };
    }

    const trimmedInput = input.trim();

    // Check if it's an airport code
    if (this.AIRPORT_CODE_REGEX.test(trimmedInput.toUpperCase())) {
      return this.validateAirportCode(trimmedInput.toUpperCase());
    }

    // Check if it's a postal code
    const postalValidation = this.validatePostalCode(trimmedInput);
    if (postalValidation.isValid) {
      return postalValidation;
    }

    // Check if it's city/country format
    return this.validateCityCountry(trimmedInput);
  }

  /**
   * Validates airport code format
   */
  private static validateAirportCode(code: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.AIRPORT_CODE_REGEX.test(code)) {
      errors.push('Airport code must be exactly 3 uppercase letters (e.g., LAX, JFK, LHR)');
    }

    // Note: In a real implementation, we would validate against a database of valid airport codes
    warnings.push('Airport code format is valid, but actual airport existence not verified');

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates postal code format for various countries
   */
  private static validatePostalCode(input: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Try to match against known postal code patterns
    const matchedCountry = Object.entries(this.POSTAL_CODE_PATTERNS).find(([_, pattern]) => 
      pattern.test(input.toUpperCase())
    );

    if (matchedCountry) {
      warnings.push(`Detected ${matchedCountry[0]} postal code format`);
      return { isValid: true, errors, warnings };
    }

    return { isValid: false, errors: ['Unrecognized postal code format'], warnings };
  }

  /**
   * Validates city/country format
   */
  private static validateCityCountry(input: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for city, country format
    if (input.includes(',')) {
      const parts = input.split(',').map(part => part.trim());
      
      if (parts.length !== 2) {
        errors.push('City/country format should be "City, Country" (e.g., "Paris, France")');
      } else {
        const [city, country] = parts;
        
        if (city.length < 2) {
          errors.push('City name must be at least 2 characters long');
        }
        
        if (country.length < 2) {
          errors.push('Country name must be at least 2 characters long');
        }

        // Check for common formatting issues
        if (city.toLowerCase() === city || country.toLowerCase() === country) {
          warnings.push('Consider using proper capitalization for city and country names');
        }
      }
    } else {
      // Single location name - could be city or country
      if (input.length < 2) {
        errors.push('Location name must be at least 2 characters long');
      }
      
      warnings.push('Single location name provided - consider specifying "City, Country" for better accuracy');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Normalizes location input into a consistent format
   */
  public static normalizeLocation(input: string): string {
    const trimmed = input.trim();
    
    // Normalize airport codes to uppercase
    if (this.AIRPORT_CODE_REGEX.test(trimmed.toUpperCase())) {
      return trimmed.toUpperCase();
    }

    // Normalize city/country format
    if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map(part => 
        part.trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
      );
      return parts.join(', ');
    }

    // Normalize single location name
    return trimmed
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Converts location input to LocationData structure
   * In a real implementation, this would call external APIs for geocoding
   */
  public static async parseLocationData(input: string): Promise<LocationData> {
    try {
      const normalized = this.normalizeLocation(input);
      
      // Handle airport code
      if (this.AIRPORT_CODE_REGEX.test(normalized)) {
        return this.parseAirportCode(normalized);
      }

      // Handle city/country format
      if (normalized.includes(',')) {
        const [city, country] = normalized.split(',').map(s => s.trim());
        return this.parseCityCountry(city, country);
      }

      // Handle single location (assume it's a city)
      return this.parseSingleLocation(normalized);
    } catch (error) {
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        input: {
          original: input,
          normalized: this.normalizeLocation(input),
          length: input?.length || 0,
          hasComma: input?.includes(',') || false,
          isAirportCode: this.AIRPORT_CODE_REGEX.test(input?.toUpperCase() || '')
        },
        timestamp: new Date().toISOString(),
        service: 'LocationService.parseLocationData'
      };
      
      console.error('Detailed error parsing location data:', errorDetails);
      
      const enhancedError = new Error(`Failed to parse location data for "${input}": ${errorDetails.message}`);
      (enhancedError as any).details = errorDetails;
      (enhancedError as any).statusCode = 500;
      throw enhancedError;
    }
  }

  /**
   * Parse airport code into LocationData
   */
  private static async parseAirportCode(code: string): Promise<LocationData> {
    // Mock data - in real implementation, would query airport database
    const mockAirportData: { [key: string]: LocationData } = {
      'LAX': {
        city: 'Los Angeles',
        country: 'United States',
        coordinates: { lat: 33.9425, lng: -118.4081 },
        airportCode: 'LAX'
      },
      'JFK': {
        city: 'New York',
        country: 'United States',
        coordinates: { lat: 40.6413, lng: -73.7781 },
        airportCode: 'JFK'
      },
      'LHR': {
        city: 'London',
        country: 'United Kingdom',
        coordinates: { lat: 51.4700, lng: -0.4543 },
        airportCode: 'LHR'
      }
    };

    if (mockAirportData[code]) {
      return mockAirportData[code];
    }

    // Default for unknown airport codes
    return {
      city: 'Unknown City',
      country: 'Unknown Country',
      coordinates: { lat: 0, lng: 0 },
      airportCode: code
    };
  }

  /**
   * Parse city/country into LocationData
   */
  private static async parseCityCountry(city: string, country: string): Promise<LocationData> {
    // Mock geocoding - in real implementation, would call geocoding API
    const mockCoordinates = this.getMockCoordinates(city, country);
    
    return {
      city,
      country,
      coordinates: mockCoordinates,
      airportCode: this.guessAirportCode(city, country)
    };
  }

  /**
   * Parse single location into LocationData
   */
  private static async parseSingleLocation(location: string): Promise<LocationData> {
    // Mock data - assume it's a major city
    const mockCoordinates = this.getMockCoordinates(location, 'Unknown');
    
    return {
      city: location,
      country: 'Unknown Country',
      coordinates: mockCoordinates
    };
  }

  /**
   * Generate mock coordinates for testing
   */
  private static getMockCoordinates(city: string, country: string): { lat: number; lng: number } {
    // Simple hash-based coordinate generation for consistent mock data
    const hash = (city + country).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const lat = (hash % 180) - 90; // -90 to 90
    const lng = ((hash * 2) % 360) - 180; // -180 to 180
    
    return { lat: Math.round(lat * 10000) / 10000, lng: Math.round(lng * 10000) / 10000 };
  }

  /**
   * Guess airport code based on city/country
   */
  private static guessAirportCode(city: string, country: string): string | undefined {
    // Mock airport code guessing
    const cityCode = city.substring(0, 3).toUpperCase();
    const knownCodes = ['LAX', 'JFK', 'LHR', 'CDG', 'NRT', 'SYD'];
    
    if (knownCodes.includes(cityCode)) {
      return cityCode;
    }
    
    return undefined;
  }
}

/**
 * UserProfileStorage handles storing and retrieving user location data
 */
export class UserProfileStorage {
  private static readonly STORAGE_KEY = 'travel_bucket_list_user_profile';

  /**
   * Store user's home location
   */
  public static storeHomeLocation(userId: string, location: LocationData): void {
    try {
      const profile = this.getUserProfile(userId);
      profile.homeLocation = location;
      this.saveUserProfile(userId, profile);
    } catch (error) {
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        location: {
          hasLocation: !!location,
          city: location?.city,
          country: location?.country,
          hasCoordinates: !!(location?.coordinates?.lat && location?.coordinates?.lng)
        },
        timestamp: new Date().toISOString(),
        service: 'UserProfileStorage.storeHomeLocation'
      };
      
      console.error('Detailed error storing home location:', errorDetails);
      
      const enhancedError = new Error(`Failed to store home location for user ${userId}: ${errorDetails.message}`);
      (enhancedError as any).details = errorDetails;
      (enhancedError as any).statusCode = 500;
      throw enhancedError;
    }
  }

  /**
   * Retrieve user's home location
   */
  public static getHomeLocation(userId: string): LocationData | null {
    const profile = this.getUserProfile(userId);
    return profile.homeLocation || null;
  }

  /**
   * Get complete user profile
   */
  public static getUserProfile(userId: string): any {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading user profile from storage:', error);
    }

    // Return default profile structure
    return {
      id: userId,
      homeLocation: null,
      preferences: {},
      bucketList: []
    };
  }

  /**
   * Save complete user profile
   */
  public static saveUserProfile(userId: string, profile: any): void {
    try {
      localStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(profile));
    } catch (error) {
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        profile: {
          hasProfile: !!profile,
          hasHomeLocation: !!profile?.homeLocation,
          hasPreferences: !!profile?.preferences,
          bucketListLength: profile?.bucketList?.length || 0
        },
        storageKey: `${this.STORAGE_KEY}_${userId}`,
        timestamp: new Date().toISOString(),
        service: 'UserProfileStorage.saveUserProfile'
      };
      
      console.error('Detailed error saving user profile:', errorDetails);
      
      const enhancedError = new Error(`Failed to save user profile for ${userId}: ${errorDetails.message}`);
      (enhancedError as any).details = errorDetails;
      (enhancedError as any).statusCode = 500;
      throw enhancedError;
    }
  }

  /**
   * Clear user profile
   */
  public static clearUserProfile(userId: string): void {
    try {
      localStorage.removeItem(`${this.STORAGE_KEY}_${userId}`);
    } catch (error) {
      console.error('Error clearing user profile from storage:', error);
    }
  }
}