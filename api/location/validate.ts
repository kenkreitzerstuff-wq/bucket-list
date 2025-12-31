import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ValidationResult, ApiResponse } from '../types';

// Simplified LocationService for serverless function
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
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
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
        code: 'VALIDATION_ERROR',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    } as ApiResponse<never>);
  }
}