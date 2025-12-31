// Simplified types for API serverless functions
// These are duplicated from backend/src/types to avoid import path issues

export interface LocationData {
  city: string;
  country: string;
  coordinates: { lat: number; lng: number };
  airportCode?: string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}