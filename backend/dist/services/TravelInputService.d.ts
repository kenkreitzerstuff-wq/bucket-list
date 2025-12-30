import { TravelInputData, ValidationResult } from '../types';
/**
 * TravelInputService handles validation and storage of travel input data
 */
export declare class TravelInputService {
    /**
     * Validates travel input data
     */
    static validateTravelInput(input: TravelInputData): ValidationResult;
    /**
     * Detects incomplete or vague input that needs follow-up questions
     */
    static detectIncompleteInput(input: TravelInputData): {
        needsFollowUp: boolean;
        incompleteAreas: string[];
        suggestions: string[];
    };
    /**
     * Generates follow-up questions based on incomplete input
     */
    static generateFollowUpQuestions(input: TravelInputData): Array<{
        id: string;
        question: string;
        type: 'text' | 'multiple-choice' | 'range';
        options?: string[];
        context: string;
    }>;
    /**
     * Stores travel input data in user profile
     */
    static storeTravelInput(userId: string, input: TravelInputData): void;
    /**
     * Retrieves stored travel input data
     */
    static getTravelInput(userId: string): TravelInputData | null;
    /**
     * Normalizes and cleans travel input data
     */
    static normalizeTravelInput(input: TravelInputData): TravelInputData;
    /**
     * Calculates completeness score of travel input (0-100)
     */
    static calculateCompletenessScore(input: TravelInputData): number;
}
//# sourceMappingURL=TravelInputService.d.ts.map