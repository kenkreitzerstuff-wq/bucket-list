"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const RecommendationEngine_1 = require("../services/RecommendationEngine");
const router = express_1.default.Router();
/**
 * POST /api/recommendations/generate
 * Generate travel recommendations based on user profile and input
 */
router.post('/generate', async (req, res) => {
    const startTime = Date.now();
    try {
        const { userProfile, travelInput } = req.body;
        // Validate required fields
        if (!userProfile || !travelInput) {
            const response = {
                success: false,
                error: {
                    message: 'Missing required fields: userProfile and travelInput are required',
                    code: 'MISSING_REQUIRED_FIELDS',
                    details: {
                        hasUserProfile: !!userProfile,
                        hasTravelInput: !!travelInput,
                        timestamp: new Date().toISOString(),
                        endpoint: '/api/recommendations/generate'
                    }
                }
            };
            return res.status(400).json(response);
        }
        if (!userProfile.homeLocation || !travelInput.destinations || !travelInput.experiences) {
            const response = {
                success: false,
                error: {
                    message: 'Invalid input: userProfile must have homeLocation, travelInput must have destinations and experiences',
                    code: 'INVALID_INPUT',
                    details: {
                        userProfile: {
                            hasHomeLocation: !!userProfile.homeLocation,
                            homeLocationCity: userProfile.homeLocation?.city
                        },
                        travelInput: {
                            hasDestinations: !!travelInput.destinations,
                            destinationCount: travelInput.destinations?.length || 0,
                            hasExperiences: !!travelInput.experiences,
                            experienceCount: travelInput.experiences?.length || 0
                        },
                        timestamp: new Date().toISOString(),
                        endpoint: '/api/recommendations/generate'
                    }
                }
            };
            return res.status(400).json(response);
        }
        // Generate recommendations
        const recommendations = await RecommendationEngine_1.RecommendationEngine.generateRecommendations(userProfile, travelInput);
        const response = {
            success: true,
            data: recommendations
        };
        res.json(response);
    }
    catch (error) {
        const errorDetails = {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            statusCode: error.statusCode || 500,
            apiErrorCode: error.apiErrorCode,
            originalDetails: error.details,
            processingTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            endpoint: '/api/recommendations/generate',
            requestBody: {
                hasUserProfile: !!req.body.userProfile,
                hasTravelInput: !!req.body.travelInput,
                userProfileKeys: req.body.userProfile ? Object.keys(req.body.userProfile) : [],
                travelInputKeys: req.body.travelInput ? Object.keys(req.body.travelInput) : []
            }
        };
        console.error('Detailed error in recommendations/generate:', errorDetails);
        const response = {
            success: false,
            error: {
                message: errorDetails.message,
                code: errorDetails.apiErrorCode || 'RECOMMENDATION_GENERATION_FAILED',
                details: process.env.NODE_ENV === 'development' ? errorDetails : {
                    timestamp: errorDetails.timestamp,
                    processingTime: errorDetails.processingTime,
                    statusCode: errorDetails.statusCode
                }
            }
        };
        res.status(errorDetails.statusCode).json(response);
    }
});
/**
 * POST /api/recommendations/follow-up-questions
 * Generate contextual follow-up questions based on user input
 */
router.post('/follow-up-questions', async (req, res) => {
    try {
        const { travelInput, userProfile } = req.body;
        // Validate required fields
        if (!travelInput || !userProfile) {
            const response = {
                success: false,
                error: {
                    message: 'Missing required fields: travelInput and userProfile are required',
                    code: 'MISSING_REQUIRED_FIELDS'
                }
            };
            return res.status(400).json(response);
        }
        // Generate follow-up questions
        const questions = await RecommendationEngine_1.RecommendationEngine.generateContextualFollowUpQuestions(travelInput, userProfile);
        const response = {
            success: true,
            data: questions
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error generating follow-up questions:', error);
        const response = {
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Failed to generate follow-up questions',
                code: 'FOLLOW_UP_GENERATION_FAILED',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            }
        };
        res.status(500).json(response);
    }
});
/**
 * POST /api/recommendations/integrate-answers
 * Process follow-up answers and generate updated recommendations
 */
router.post('/integrate-answers', async (req, res) => {
    try {
        const { originalInput, followUpAnswers, userProfile } = req.body;
        // Validate required fields
        if (!originalInput || !followUpAnswers || !userProfile) {
            const response = {
                success: false,
                error: {
                    message: 'Missing required fields: originalInput, followUpAnswers, and userProfile are required',
                    code: 'MISSING_REQUIRED_FIELDS'
                }
            };
            return res.status(400).json(response);
        }
        // Integrate answers and generate new recommendations
        const result = await RecommendationEngine_1.RecommendationEngine.integrateFollowUpAnswers(originalInput, followUpAnswers, userProfile);
        const response = {
            success: true,
            data: result
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error integrating follow-up answers:', error);
        const response = {
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Failed to integrate follow-up answers',
                code: 'ANSWER_INTEGRATION_FAILED',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            }
        };
        res.status(500).json(response);
    }
});
/**
 * GET /api/recommendations/bucket-list
 * Get bucket list data for reference
 */
router.get('/bucket-list', async (req, res) => {
    try {
        const { BucketListDataService } = await Promise.resolve().then(() => __importStar(require('../services/BucketListDataService')));
        const { status = 'incomplete', priority, gailInterest, tags, difficulty, minDuration, maxDuration } = req.query;
        let items;
        if (status === 'all') {
            items = BucketListDataService.getAllBucketListItems();
        }
        else if (status === 'completed') {
            items = BucketListDataService.getCompletedBucketListItems();
        }
        else {
            items = BucketListDataService.getIncompleteBucketListItems();
        }
        // Apply filters
        if (priority) {
            items = BucketListDataService.getItemsByPriority(parseInt(priority));
        }
        if (gailInterest) {
            items = BucketListDataService.getItemsByGailInterest(gailInterest);
        }
        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : [tags];
            items = BucketListDataService.getItemsByTags(tagArray);
        }
        if (difficulty) {
            items = BucketListDataService.getItemsByDifficulty(difficulty);
        }
        if (minDuration || maxDuration) {
            const min = minDuration ? parseInt(minDuration) : 1;
            const max = maxDuration ? parseInt(maxDuration) : 365;
            items = BucketListDataService.getItemsByDuration(min, max);
        }
        const response = {
            success: true,
            data: items
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching bucket list:', error);
        const response = {
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Failed to fetch bucket list',
                code: 'BUCKET_LIST_FETCH_FAILED',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            }
        };
        res.status(500).json(response);
    }
});
exports.default = router;
//# sourceMappingURL=recommendationRoutes.js.map