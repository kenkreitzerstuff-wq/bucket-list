"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const LocationService_1 = require("../services/LocationService");
const router = express_1.default.Router();
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
            });
        }
        const validation = LocationService_1.LocationService.validateLocation(location);
        res.json({
            success: true,
            data: {
                validation,
                normalized: validation.isValid ? LocationService_1.LocationService.normalizeLocation(location) : null
            }
        });
    }
    catch (error) {
        console.error('Location validation error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error during location validation',
                code: 'VALIDATION_ERROR',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            }
        });
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
            });
        }
        // First validate the location
        const validation = LocationService_1.LocationService.validateLocation(location);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid location format',
                    code: 'INVALID_LOCATION',
                    details: validation.errors
                }
            });
        }
        const locationData = await LocationService_1.LocationService.parseLocationData(location);
        res.json({
            success: true,
            data: {
                locationData,
                validation
            }
        });
    }
    catch (error) {
        console.error('Location parsing error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error during location parsing',
                code: 'PARSING_ERROR',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            }
        });
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
            });
        }
        if (!location || typeof location !== 'string') {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Location input is required and must be a string',
                    code: 'INVALID_INPUT'
                }
            });
        }
        // Validate and parse the location
        const validation = LocationService_1.LocationService.validateLocation(location);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid location format',
                    code: 'INVALID_LOCATION',
                    details: validation.errors
                }
            });
        }
        const locationData = await LocationService_1.LocationService.parseLocationData(location);
        // Store the home location
        LocationService_1.UserProfileStorage.storeHomeLocation(userId, locationData);
        res.json({
            success: true,
            data: {
                homeLocation: locationData,
                message: 'Home location updated successfully'
            }
        });
    }
    catch (error) {
        console.error('Home location update error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error during home location update',
                code: 'STORAGE_ERROR',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            }
        });
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
            });
        }
        const homeLocation = LocationService_1.UserProfileStorage.getHomeLocation(userId);
        if (!homeLocation) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Home location not found for user',
                    code: 'HOME_LOCATION_NOT_FOUND'
                }
            });
        }
        res.json({
            success: true,
            data: { homeLocation }
        });
    }
    catch (error) {
        console.error('Home location retrieval error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error during home location retrieval',
                code: 'RETRIEVAL_ERROR',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            }
        });
    }
});
exports.default = router;
//# sourceMappingURL=locationRoutes.js.map