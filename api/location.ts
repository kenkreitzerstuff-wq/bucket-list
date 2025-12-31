import type { VercelRequest, VercelResponse } from '@vercel/node';

// Types
interface LocationData {
  city: string;
  country: string;
  coordinates: { lat: number; lng: number };
  airportCode?: string | null;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

// In-memory storage for demo
const userProfiles: { [userId: string]: any } = {};

// Simplified LocationService
class LocationService {
  private static readonly AIRPORT_CODE_REGEX = /^[A-Z]{3}$/;
  private static readonly POSTAL_CODE_PATTERNS = {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Z]\d[A-Z] \d[A-Z]\d$/,
    UK: /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/,
    DE: /^\d{5}$/,
    FR: /^\d{5}$/,
  };

  public static validateLocation(input: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input || input.trim().length === 0) {
      errors.push('Location input cannot be empty');
      return { isValid: false, errors, warnings };
    }

    const trimmedInput = input.trim();

    if (this.AIRPORT_CODE_REGEX.test(trimmedInput.toUpperCase())) {
      return this.validateAirportCode(trimmedInput.toUpperCase());
    }

    const postalValidation = this.validatePostalCode(trimmedInput);
    if (postalValidation.isValid) {
      return postalValidation;
    }

    return this.validateCityCountry(trimmedInput);
  }

  private static validateAirportCode(code: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.AIRPORT_CODE_REGEX.test(code)) {
      errors.push('Airport code must be exactly 3 uppercase letters (e.g., LAX, JFK, LHR)');
    }

    warnings.push('Airport code format is valid, but actual airport existence not verified');

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static validatePostalCode(input: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const matchedCountry = Object.entries(this.POSTAL_CODE_PATTERNS).find(([_, pattern]) => 
      pattern.test(input.toUpperCase())
    );

    if (matchedCountry) {
      warnings.push(`Detected ${matchedCountry[0]} postal code format`);
      return { isValid: true, errors, warnings };
    }

    return { isValid: false, errors: ['Unrecognized postal code format'], warnings };
  }

  private static validateCityCountry(input: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

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

        if (city.toLowerCase() === city || country.toLowerCase() === country) {
          warnings.push('Consider using proper capitalization for city and country names');
        }
      }
    } else {
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

  public static normalizeLocation(input: string): string {
    const trimmed = input.trim();
    
    if (this.AIRPORT_CODE_REGEX.test(trimmed.toUpperCase())) {
      return trimmed.toUpperCase();
    }

    if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map(part => 
        part.trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
      );
      return parts.join(', ');
    }

    return trimmed
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  public static async parseLocationData(input: string): Promise<LocationData> {
    const normalized = this.normalizeLocation(input);
    
    if (this.AIRPORT_CODE_REGEX.test(normalized)) {
      return this.parseAirportCode(normalized);
    }

    if (normalized.includes(',')) {
      const [city, country] = normalized.split(',').map(s => s.trim());
      return this.parseCityCountry(city, country);
    }

    return this.parseSingleLocation(normalized);
  }

  private static async parseAirportCode(code: string): Promise<LocationData> {
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

    return {
      city: 'Unknown City',
      country: 'Unknown Country',
      coordinates: { lat: 0, lng: 0 },
      airportCode: code
    };
  }

  private static async parseCityCountry(city: string, country: string): Promise<LocationData> {
    const mockCoordinates = this.getMockCoordinates(city, country);
    
    return {
      city,
      country,
      coordinates: mockCoordinates,
      airportCode: this.guessAirportCode(city, country)
    };
  }

  private static async parseSingleLocation(location: string): Promise<LocationData> {
    const mockCoordinates = this.getMockCoordinates(location, 'Unknown');
    
    return {
      city: location,
      country: 'Unknown Country',
      coordinates: mockCoordinates
    };
  }

  private static getMockCoordinates(city: string, country: string): { lat: number; lng: number } {
    const hash = (city + country).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const lat = (hash % 180) - 90;
    const lng = ((hash * 2) % 360) - 180;
    
    return { lat: Math.round(lat * 10000) / 10000, lng: Math.round(lng * 10000) / 10000 };
  }

  private static guessAirportCode(city: string, country: string): string | undefined {
    const cityCode = city.substring(0, 3).toUpperCase();
    const knownCodes = ['LAX', 'JFK', 'LHR', 'CDG', 'NRT', 'SYD'];
    
    if (knownCodes.includes(cityCode)) {
      return cityCode;
    }
    
    return undefined;
  }
}

// UserProfileStorage
class UserProfileStorage {
  public static storeHomeLocation(userId: string, location: LocationData): void {
    if (!userProfiles[userId]) {
      userProfiles[userId] = {
        id: userId,
        homeLocation: null,
        preferences: {},
        bucketList: []
      };
    }
    userProfiles[userId].homeLocation = location;
  }

  public static getHomeLocation(userId: string): LocationData | null {
    const profile = userProfiles[userId];
    return profile?.homeLocation || null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req;
  console.log('Location API called:', req.method, url);

  try {
    // Handle /api/location/validate
    if (url?.includes('/validate') && req.method === 'POST') {
      const { location } = req.body;

      if (!location || typeof location !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Location input is required and must be a string',
            code: 'INVALID_INPUT'
          }
        } as ApiResponse<never>);
      }

      const validation: ValidationResult = LocationService.validateLocation(location);
      
      return res.json({
        success: true,
        data: {
          validation,
          normalized: validation.isValid ? LocationService.normalizeLocation(location) : null
        }
      } as ApiResponse<{ validation: ValidationResult; normalized: string | null }>);
    }

    // Handle /api/location/parse
    if (url?.includes('/parse') && req.method === 'POST') {
      const { location } = req.body;

      if (!location || typeof location !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Location input is required and must be a string',
            code: 'INVALID_INPUT'
          }
        } as ApiResponse<never>);
      }

      const validation = LocationService.validateLocation(location);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid location format',
            code: 'INVALID_LOCATION',
            details: validation.errors
          }
        } as ApiResponse<never>);
      }

      const locationData: LocationData = await LocationService.parseLocationData(location);
      
      return res.json({
        success: true,
        data: {
          locationData,
          validation
        }
      } as ApiResponse<{ locationData: LocationData; validation: ValidationResult }>);
    }

    // Handle /api/location/home POST
    if (url?.includes('/home') && req.method === 'POST') {
      const { userId, location } = req.body;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'User ID is required and must be a string',
            code: 'INVALID_USER_ID'
          }
        } as ApiResponse<never>);
      }

      if (!location || typeof location !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Location input is required and must be a string',
            code: 'INVALID_INPUT'
          }
        } as ApiResponse<never>);
      }

      const validation = LocationService.validateLocation(location);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid location format',
            code: 'INVALID_LOCATION',
            details: validation.errors
          }
        } as ApiResponse<never>);
      }

      const locationData: LocationData = await LocationService.parseLocationData(location);
      UserProfileStorage.storeHomeLocation(userId, locationData);
      
      return res.json({
        success: true,
        data: {
          homeLocation: locationData,
          message: 'Home location updated successfully'
        }
      } as ApiResponse<{ homeLocation: LocationData; message: string }>);
    }

    // Handle /api/location/home GET with userId in path
    if (url?.includes('/home/') && req.method === 'GET') {
      const userId = url.split('/home/')[1];

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'User ID is required',
            code: 'INVALID_USER_ID'
          }
        } as ApiResponse<never>);
      }

      const homeLocation = UserProfileStorage.getHomeLocation(userId);
      
      if (!homeLocation) {
        // Return a default location for demo purposes
        const defaultLocation: LocationData = {
          city: 'San Francisco',
          country: 'United States',
          coordinates: { lat: 37.7749, lng: -122.4194 },
          airportCode: 'SFO'
        };

        return res.json({
          success: true,
          data: { homeLocation: defaultLocation }
        } as ApiResponse<{ homeLocation: LocationData }>);
      }

      return res.json({
        success: true,
        data: { homeLocation }
      } as ApiResponse<{ homeLocation: LocationData }>);
    }

    // Default 404
    return res.status(404).json({
      success: false,
      error: {
        message: 'Location API endpoint not found',
        code: 'ENDPOINT_NOT_FOUND',
        details: { method: req.method, url }
      }
    } as ApiResponse<never>);

  } catch (error) {
    console.error('Location API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    } as ApiResponse<never>);
  }
}