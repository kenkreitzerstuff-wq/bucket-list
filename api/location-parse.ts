import type { VercelRequest, VercelResponse } from '@vercel/node';

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

class LocationService {
  private static readonly AIRPORT_CODE_REGEX = /^[A-Z]{3}$/;

  public static validateLocation(input: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input || input.trim().length === 0) {
      errors.push('Location input cannot be empty');
      return { isValid: false, errors, warnings };
    }

    return { isValid: true, errors, warnings };
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        message: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED'
      }
    } as ApiResponse<never>);
  }

  try {
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
    
    res.json({
      success: true,
      data: {
        locationData,
        validation
      }
    } as ApiResponse<{ locationData: LocationData; validation: ValidationResult }>);

  } catch (error) {
    console.error('Location parsing error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during location parsing',
        code: 'PARSING_ERROR'
      }
    } as ApiResponse<never>);
  }
}