import express from 'express';
import { LocationService, UserProfileStorage } from '../services/LocationService';
import { ApiResponse, LocationData, ValidationResult } from '../types';

const router = express.Router();

/**
 * POST /api/location/validate
 * Validates location input in various formats
 */
router.post('/validate', async (req, res) => {
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
});

/**
 * POST /api/location/parse
 * Parses location input into structured LocationData
 */
router.post('/parse', async (req, res) => {
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

    // First validate the location
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
        code: 'PARSING_ERROR',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    } as ApiResponse<never>);
  }
});

/**
 * POST /api/location/home
 * Set user's home location
 */
router.post('/home', async (req, res) => {
  try {
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

    // Validate and parse the location
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
    
    // Store the home location
    UserProfileStorage.storeHomeLocation(userId, locationData);
    
    res.json({
      success: true,
      data: {
        homeLocation: locationData,
        message: 'Home location updated successfully'
      }
    } as ApiResponse<{ homeLocation: LocationData; message: string }>);

  } catch (error) {
    console.error('Home location update error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during home location update',
        code: 'STORAGE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    } as ApiResponse<never>);
  }
});

/**
 * GET /api/location/home/:userId
 * Get user's home location
 */
router.get('/home/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

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
      return res.status(404).json({
        success: false,
        error: {
          message: 'Home location not found for user',
          code: 'HOME_LOCATION_NOT_FOUND'
        }
      } as ApiResponse<never>);
    }

    res.json({
      success: true,
      data: { homeLocation }
    } as ApiResponse<{ homeLocation: LocationData }>);

  } catch (error) {
    console.error('Home location retrieval error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during home location retrieval',
        code: 'RETRIEVAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    } as ApiResponse<never>);
  }
});

export default router;