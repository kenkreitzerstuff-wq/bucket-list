import { UserProfile, TravelInputData, Recommendation, FollowUpQuestion } from '../types';
/**
 * RecommendationEngine handles AI-powered travel recommendations
 * Integrates with BucketListDataService for Ken and Gail's bucket list data
 */
export declare class RecommendationEngine {
    private static readonly API_TIMEOUT;
    private static readonly MAX_RETRIES;
    /**
     * Generates personalized travel recommendations based on user profile and bucket list data
     */
    static generateRecommendations(userProfile: UserProfile, travelInput: TravelInputData): Promise<Recommendation[]>;
    /**
     * Generates contextual follow-up questions based on user input
     */
    static generateContextualFollowUpQuestions(travelInput: TravelInputData, userProfile: UserProfile): Promise<FollowUpQuestion[]>;
    /**
     * Processes follow-up answers and integrates them into recommendations
     */
    static integrateFollowUpAnswers(originalInput: TravelInputData, followUpAnswers: {
        [questionId: string]: string | string[];
    }, userProfile: UserProfile): Promise<{
        updatedInput: TravelInputData;
        recommendations: Recommendation[];
    }>;
    /**
     * Generates recommendations from Ken and Gail's bucket list data
     */
    private static generateBucketListRecommendations;
    /**
     * Generates AI-powered recommendations (placeholder for future OpenAI integration)
     */
    private static generateAIRecommendations;
    /**
     * Calculates match score between bucket list item and user input
     */
    private static calculateBucketListMatchScore;
    /**
     * Generates description for bucket list item
     */
    private static getBucketListDescription;
    /**
     * Generates reasoning for bucket list recommendations
     */
    private static generateBucketListReasoning;
    /**
     * Extracts related terms for recommendation
     */
    private static extractRelatedTerms;
    /**
     * Generates experience recommendations from bucket list
     */
    private static generateExperienceRecommendationsFromBucketList;
    /**
     * Maps difficulty from user preferences
     */
    private static mapDifficultyFromPreferences;
    /**
     * Maps duration from user preferences
     */
    private static mapDurationFromPreferences;
    /**
     * Generates smart recommendations based on analysis
     */
    private static generateSmartRecommendations;
    /**
     * Analyzes user input for patterns
     */
    private static analyzeUserInput;
    /**
     * Generates smart follow-up questions based on input analysis
     */
    private static generateSmartFollowUpQuestions;
    /**
     * Processes follow-up answers and updates travel input
     */
    private static processFollowUpAnswers;
}
//# sourceMappingURL=RecommendationEngine.d.ts.map