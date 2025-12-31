import type { VercelRequest, VercelResponse } from '@vercel/node';

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

    const trimmedInput = input.trim();

    if (this.AIRPORT_CODE_REGEX.test(trimmedInput.toUpperCase())) {
      warnings.push('Airport code format is valid, but actual airport existence not verified');
      return { isValid: true, errors, warnings };
    }

    if (trimmedInput.includes(',')) {
      const parts = trimmedInput.split(',').map(part => part.trim());
      
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
      }
    } else {
      if (trimmedInput.length < 2) {
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
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Location validate API called:', req.method, req.url);
  
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

    const validation: ValidationResult = LocationService.validateLocation(location);
    
    res.json({
      success: true,
      data: {
        validation,
        normalized: validation.isValid ? LocationService.normalizeLocation(location) : null
      }
    } as ApiResponse<{ validation: ValidationResult; normalized: string | null }>);

  } catch (error) {
    console.error('Location validation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during location validation',
        code: 'VALIDATION_ERROR'
      }
    } as ApiResponse<never>);
  }
}