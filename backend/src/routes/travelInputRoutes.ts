import express from 'express';
import { TravelInputService } from '../services/TravelInputService';
import { ApiResponse, TravelInputData, ValidationResult } from '../types';

const router = express.Router();

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
      } as ApiResponse<never>);
    }

    const validation: ValidationResult = TravelInputService.validateTravelInput(travelInput);
    const completenessScore = TravelInputService.calculateCompletenessScore(travelInput);
    const incompleteAnalysis = TravelInputService.detectIncompleteInput(travelInput);
    
    res.json({
      success: true,
      data: {
        validation,
        completenessScore,
        incompleteAnalysis,
        normalized: validation.isValid ? TravelInputService.normalizeTravelInput(travelInput) : null
      }
    } as ApiResponse<{
      validation: ValidationResult;
      completenessScore: number;
      incompleteAnalysis: any;
      normalized: TravelInputData | null;
    }>);

  } catch (error) {
    console.error('Travel input validation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during travel input validation',
        code: 'VALIDATION_ERROR',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    } as ApiResponse<never>);
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
      } as ApiResponse<never>);
    }

    const questions = TravelInputService.generateFollowUpQuestions(travelInput);
    const incompleteAnalysis = TravelInputService.detectIncompleteInput(travelInput);
    
    res.json({
      success: true,
      data: {
        questions,
        incompleteAnalysis,
        hasFollowUp: questions.length > 0
      }
    } as ApiResponse<{
      questions: any[];
      incompleteAnalysis: any;
      hasFollowUp: boolean;
    }>);

  } catch (error) {
    console.error('Follow-up questions generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during follow-up questions generation',
        code: 'FOLLOWUP_ERROR',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    } as ApiResponse<never>);
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
      } as ApiResponse<never>);
    }

    if (!travelInput || typeof travelInput !== 'object') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Travel input data is required and must be an object',
          code: 'INVALID_INPUT'
        }
      } as ApiResponse<never>);
    }

    // Validate the input first
    const validation = TravelInputService.validateTravelInput(travelInput);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid travel input data',
          code: 'INVALID_TRAVEL_INPUT',
          details: validation.errors
        }
      } as ApiResponse<never>);
    }

    // Normalize and store the input
    const normalizedInput = TravelInputService.normalizeTravelInput(travelInput);
    TravelInputService.storeTravelInput(userId, normalizedInput);
    
    const completenessScore = TravelInputService.calculateCompletenessScore(normalizedInput);
    
    res.json({
      success: true,
      data: {
        message: 'Travel input stored successfully',
        completenessScore,
        storedInput: normalizedInput
      }
    } as ApiResponse<{
      message: string;
      completenessScore: number;
      storedInput: TravelInputData;
    }>);

  } catch (error) {
    console.error('Travel input storage error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during travel input storage',
        code: 'STORAGE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    } as ApiResponse<never>);
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
      } as ApiResponse<never>);
    }

    const travelInput = TravelInputService.getTravelInput(userId);
    
    if (!travelInput) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Travel input not found for user',
          code: 'TRAVEL_INPUT_NOT_FOUND'
        }
      } as ApiResponse<never>);
    }

    const completenessScore = TravelInputService.calculateCompletenessScore(travelInput);
    const incompleteAnalysis = TravelInputService.detectIncompleteInput(travelInput);

    res.json({
      success: true,
      data: {
        travelInput,
        completenessScore,
        incompleteAnalysis
      }
    } as ApiResponse<{
      travelInput: TravelInputData;
      completenessScore: number;
      incompleteAnalysis: any;
    }>);

  } catch (error) {
    console.error('Travel input retrieval error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during travel input retrieval',
        code: 'RETRIEVAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    } as ApiResponse<never>);
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
      } as ApiResponse<never>);
    }

    // Clear travel input by storing null/empty data
    TravelInputService.storeTravelInput(userId, {
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
    } as ApiResponse<{ message: string }>);

  } catch (error) {
    console.error('Travel input clearing error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during travel input clearing',
        code: 'CLEARING_ERROR',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    } as ApiResponse<never>);
  }
});

export default router;