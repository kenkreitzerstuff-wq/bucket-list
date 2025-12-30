"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const TravelInputService_1 = require("../services/TravelInputService");
const router = express_1.default.Router();
/**
 * POST /api/travel-input/validate
 * Validates travel input data
 */
router.post('/validate', async (req, res) => {
    try {
        const { travelInput } = req.body;
        if (!travelInput || typeof travelInput !== 'object') {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Travel input data is required and must be an object',
                    code: 'INVALID_INPUT'
                }
            });
        }
        const validation = TravelInputService_1.TravelInputService.validateTravelInput(travelInput);
        const completenessScore = TravelInputService_1.TravelInputService.calculateCompletenessScore(travelInput);
        const incompleteAnalysis = TravelInputService_1.TravelInputService.detectIncompleteInput(travelInput);
        res.json({
            success: true,
            data: {
                validation,
                completenessScore,
                incompleteAnalysis,
                normalized: validation.isValid ? TravelInputService_1.TravelInputService.normalizeTravelInput(travelInput) : null
            }
        });
    }
    catch (error) {
        console.error('Travel input validation error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error during travel input validation',
                code: 'VALIDATION_ERROR',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            }
        });
    }
});
/**
 * POST /api/travel-input/follow-up-questions
 * Generates follow-up questions for incomplete input
 */
router.post('/follow-up-questions', async (req, res) => {
    try {
        const { travelInput } = req.body;
        if (!travelInput || typeof travelInput !== 'object') {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Travel input data is required and must be an object',
                    code: 'INVALID_INPUT'
                }
            });
        }
        const questions = TravelInputService_1.TravelInputService.generateFollowUpQuestions(travelInput);
        const incompleteAnalysis = TravelInputService_1.TravelInputService.detectIncompleteInput(travelInput);
        res.json({
            success: true,
            data: {
                questions,
                incompleteAnalysis,
                hasFollowUp: questions.length > 0
            }
        });
    }
    catch (error) {
        console.error('Follow-up questions generation error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error during follow-up questions generation',
                code: 'FOLLOWUP_ERROR',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            }
        });
    }
});
/**
 * POST /api/travel-input/store
 * Stores travel input data for a user
 */
router.post('/store', async (req, res) => {
    try {
        const { userId, travelInput } = req.body;
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'User ID is required and must be a string',
                    code: 'INVALID_USER_ID'
                }
            });
        }
        if (!travelInput || typeof travelInput !== 'object') {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Travel input data is required and must be an object',
                    code: 'INVALID_INPUT'
                }
            });
        }
        // Validate the input first
        const validation = TravelInputService_1.TravelInputService.validateTravelInput(travelInput);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid travel input data',
                    code: 'INVALID_TRAVEL_INPUT',
                    details: validation.errors
                }
            });
        }
        // Normalize and store the input
        const normalizedInput = TravelInputService_1.TravelInputService.normalizeTravelInput(travelInput);
        TravelInputService_1.TravelInputService.storeTravelInput(userId, normalizedInput);
        const completenessScore = TravelInputService_1.TravelInputService.calculateCompletenessScore(normalizedInput);
        res.json({
            success: true,
            data: {
                message: 'Travel input stored successfully',
                completenessScore,
                storedInput: normalizedInput
            }
        });
    }
    catch (error) {
        console.error('Travel input storage error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error during travel input storage',
                code: 'STORAGE_ERROR',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            }
        });
    }
});
/**
 * GET /api/travel-input/:userId
 * Retrieves stored travel input data for a user
 */
router.get('/:userId', async (req, res) => {
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
        const travelInput = TravelInputService_1.TravelInputService.getTravelInput(userId);
        if (!travelInput) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Travel input not found for user',
                    code: 'TRAVEL_INPUT_NOT_FOUND'
                }
            });
        }
        const completenessScore = TravelInputService_1.TravelInputService.calculateCompletenessScore(travelInput);
        const incompleteAnalysis = TravelInputService_1.TravelInputService.detectIncompleteInput(travelInput);
        res.json({
            success: true,
            data: {
                travelInput,
                completenessScore,
                incompleteAnalysis
            }
        });
    }
    catch (error) {
        console.error('Travel input retrieval error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error during travel input retrieval',
                code: 'RETRIEVAL_ERROR',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            }
        });
    }
});
/**
 * DELETE /api/travel-input/:userId
 * Clears stored travel input data for a user
 */
router.delete('/:userId', async (req, res) => {
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
        // Clear travel input by storing null/empty data
        TravelInputService_1.TravelInputService.storeTravelInput(userId, {
            destinations: [],
            experiences: [],
            preferences: undefined,
            timeframe: undefined
        });
        res.json({
            success: true,
            data: {
                message: 'Travel input cleared successfully'
            }
        });
    }
    catch (error) {
        console.error('Travel input clearing error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error during travel input clearing',
                code: 'CLEARING_ERROR',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            }
        });
    }
});
exports.default = router;
//# sourceMappingURL=travelInputRoutes.js.map