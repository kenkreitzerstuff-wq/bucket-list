"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationEngine = void 0;
const BucketListDataService_1 = require("./BucketListDataService");
/**
 * RecommendationEngine handles AI-powered travel recommendations
 * Integrates with BucketListDataService for Ken and Gail's bucket list data
 */
class RecommendationEngine {
    /**
     * Generates personalized travel recommendations based on user profile and bucket list data
     */
    static async generateRecommendations(userProfile, travelInput) {
        try {
            // Get recommendations from Ken and Gail's bucket list first
            const bucketListRecommendations = this.generateBucketListRecommendations(userProfile, travelInput);
            // Generate additional AI-powered recommendations
            const aiRecommendations = await this.generateAIRecommendations(userProfile, travelInput);
            // Combine and rank all recommendations
            const allRecommendations = [...bucketListRecommendations, ...aiRecommendations];
            // Sort by confidence and relevance
            return allRecommendations
                .sort((a, b) => b.confidence - a.confidence)
                .slice(0, 8); // Limit to top 8 recommendations
        }
        catch (error) {
            const errorDetails = {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                userProfile: {
                    hasHomeLocation: !!userProfile?.homeLocation,
                    homeLocationCity: userProfile?.homeLocation?.city,
                    preferencesProvided: !!userProfile?.preferences
                },
                travelInput: {
                    destinationCount: travelInput?.destinations?.length || 0,
                    experienceCount: travelInput?.experiences?.length || 0,
                    hasPreferences: !!travelInput?.preferences
                },
                timestamp: new Date().toISOString(),
                service: 'RecommendationEngine.generateRecommendations'
            };
            console.error('Detailed error generating recommendations:', errorDetails);
            const enhancedError = new Error(`Failed to generate travel recommendations: ${errorDetails.message}`);
            enhancedError.details = errorDetails;
            enhancedError.statusCode = 500;
            throw enhancedError;
        }
    }
    /**
     * Generates contextual follow-up questions based on user input
     */
    static async generateContextualFollowUpQuestions(travelInput, userProfile) {
        try {
            // Generate smart follow-up questions based on analysis
            const generatedQuestions = await this.generateSmartFollowUpQuestions(travelInput, userProfile);
            return generatedQuestions;
        }
        catch (error) {
            const errorDetails = {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                travelInput: {
                    destinationCount: travelInput?.destinations?.length || 0,
                    experienceCount: travelInput?.experiences?.length || 0,
                    hasPreferences: !!travelInput?.preferences,
                    destinations: travelInput?.destinations || [],
                    experiences: travelInput?.experiences || []
                },
                userProfile: {
                    hasHomeLocation: !!userProfile?.homeLocation,
                    homeLocationCity: userProfile?.homeLocation?.city
                },
                timestamp: new Date().toISOString(),
                service: 'RecommendationEngine.generateContextualFollowUpQuestions'
            };
            console.error('Detailed error generating follow-up questions:', errorDetails);
            const enhancedError = new Error(`Failed to generate follow-up questions: ${errorDetails.message}`);
            enhancedError.details = errorDetails;
            enhancedError.statusCode = 500;
            throw enhancedError;
        }
    }
    /**
     * Processes follow-up answers and integrates them into recommendations
     */
    static async integrateFollowUpAnswers(originalInput, followUpAnswers, userProfile) {
        try {
            // Process and integrate follow-up answers
            const updatedInput = this.processFollowUpAnswers(originalInput, followUpAnswers);
            // Generate new recommendations based on updated input
            const recommendations = await this.generateRecommendations(userProfile, updatedInput);
            return {
                updatedInput,
                recommendations
            };
        }
        catch (error) {
            const errorDetails = {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                originalInput: {
                    destinationCount: originalInput?.destinations?.length || 0,
                    experienceCount: originalInput?.experiences?.length || 0,
                    hasPreferences: !!originalInput?.preferences
                },
                followUpAnswers: {
                    answerCount: Object.keys(followUpAnswers || {}).length,
                    questionIds: Object.keys(followUpAnswers || [])
                },
                userProfile: {
                    hasHomeLocation: !!userProfile?.homeLocation,
                    homeLocationCity: userProfile?.homeLocation?.city
                },
                timestamp: new Date().toISOString(),
                service: 'RecommendationEngine.integrateFollowUpAnswers'
            };
            console.error('Detailed error integrating follow-up answers:', errorDetails);
            const enhancedError = new Error(`Failed to integrate follow-up answers: ${errorDetails.message}`);
            enhancedError.details = errorDetails;
            enhancedError.statusCode = 500;
            throw enhancedError;
        }
    }
    /**
     * Generates recommendations from Ken and Gail's bucket list data
     */
    static generateBucketListRecommendations(userProfile, travelInput) {
        const recommendations = [];
        // Get recommended items from bucket list based on user preferences
        const bucketListItems = BucketListDataService_1.BucketListDataService.getRecommendedItems({
            interests: travelInput.preferences?.interests,
            travelStyle: travelInput.preferences?.travelStyle,
            difficulty: this.mapDifficultyFromPreferences(travelInput.preferences),
            duration: this.mapDurationFromPreferences(travelInput.preferences?.travelDuration),
            prioritizeGailInterest: true // Prioritize Gail's high interest items
        });
        // Convert bucket list items to recommendations
        bucketListItems.slice(0, 5).forEach((item) => {
            const matchScore = this.calculateBucketListMatchScore(item, travelInput);
            recommendations.push({
                type: 'destination',
                title: item.destination,
                description: `${item.destination} offers ${item.experiences.slice(0, 3).join(', ')}. ${this.getBucketListDescription(item)}`,
                reasoning: this.generateBucketListReasoning(item, travelInput, matchScore),
                confidence: matchScore,
                relatedTo: this.extractRelatedTerms(item, travelInput),
                metadata: {
                    season: item.bestSeason,
                    duration: item.estimatedDuration,
                    difficulty: item.difficulty
                }
            });
        });
        // Add experience-based recommendations from bucket list
        const experienceRecommendations = this.generateExperienceRecommendationsFromBucketList(travelInput);
        recommendations.push(...experienceRecommendations);
        return recommendations;
    }
    /**
     * Generates AI-powered recommendations (placeholder for future OpenAI integration)
     */
    static async generateAIRecommendations(userProfile, travelInput) {
        // For now, generate smart recommendations based on input analysis
        // In future, this will integrate with OpenAI API
        return this.generateSmartRecommendations(userProfile, travelInput);
    }
    /**
     * Calculates match score between bucket list item and user input
     */
    static calculateBucketListMatchScore(item, travelInput) {
        let score = 0.5; // Base score
        // Check destination matches
        const destinationMatches = travelInput.destinations.some((dest) => item.destination.toLowerCase().includes(dest.toLowerCase()) ||
            dest.toLowerCase().includes(item.destination.toLowerCase().split('(')[0].trim().toLowerCase()));
        if (destinationMatches)
            score += 0.3;
        // Check experience matches
        const experienceMatches = travelInput.experiences.some((exp) => item.experiences.some((bucketExp) => bucketExp.toLowerCase().includes(exp.toLowerCase()) ||
            exp.toLowerCase().includes(bucketExp.toLowerCase())));
        if (experienceMatches)
            score += 0.2;
        // Check interest/tag matches
        if (travelInput.preferences?.interests) {
            const interestMatches = travelInput.preferences.interests.some((interest) => item.tags.some((tag) => tag.includes(interest.toLowerCase())));
            if (interestMatches)
                score += 0.15;
        }
        // Boost high priority items
        if (item.kenPriority <= 2)
            score += 0.1;
        if (item.gailInterestLevel === 'HIGH')
            score += 0.15;
        return Math.min(score, 1.0);
    }
    /**
     * Generates description for bucket list item
     */
    static getBucketListDescription(item) {
        const descriptions = [
            `Best visited during ${item.bestSeason}.`,
            `Estimated duration: ${item.estimatedDuration} days.`,
            `Difficulty level: ${item.difficulty}.`
        ];
        if (item.kenPriority <= 2) {
            descriptions.push("High priority on Ken's list.");
        }
        if (item.gailInterestLevel === 'HIGH') {
            descriptions.push("Gail is particularly excited about this destination.");
        }
        return descriptions.join(' ');
    }
    /**
     * Generates reasoning for bucket list recommendations
     */
    static generateBucketListReasoning(item, travelInput, matchScore) {
        const reasons = [];
        if (matchScore > 0.8) {
            reasons.push("This is an excellent match from Ken and Gail's bucket list");
        }
        else if (matchScore > 0.6) {
            reasons.push("This destination from the bucket list aligns well with your interests");
        }
        else {
            reasons.push("This bucket list destination offers interesting possibilities");
        }
        // Add specific matching reasons
        const destinationMatch = travelInput.destinations.some((dest) => item.destination.toLowerCase().includes(dest.toLowerCase()));
        if (destinationMatch) {
            reasons.push("matches your stated destination interest");
        }
        const experienceMatch = travelInput.experiences.some((exp) => item.experiences.some((bucketExp) => bucketExp.toLowerCase().includes(exp.toLowerCase())));
        if (experienceMatch) {
            reasons.push("offers experiences you're looking for");
        }
        if (item.gailInterestLevel === 'HIGH') {
            reasons.push("is highly recommended by Gail");
        }
        return reasons.join(', ') + '.';
    }
    /**
     * Extracts related terms for recommendation
     */
    static extractRelatedTerms(item, travelInput) {
        const related = [];
        // Add destination name
        related.push(item.destination.split('(')[0].trim());
        // Add matching experiences
        item.experiences.slice(0, 2).forEach((exp) => related.push(exp));
        // Add matching tags
        item.tags.slice(0, 2).forEach((tag) => related.push(tag));
        return related;
    }
    /**
     * Generates experience recommendations from bucket list
     */
    static generateExperienceRecommendationsFromBucketList(travelInput) {
        const recommendations = [];
        // Find unique experiences from bucket list that match user interests
        const allBucketItems = BucketListDataService_1.BucketListDataService.getIncompleteBucketListItems();
        const uniqueExperiences = new Set();
        allBucketItems.forEach((item) => {
            item.experiences.forEach((exp) => {
                const matchesUserInput = travelInput.experiences.some((userExp) => exp.toLowerCase().includes(userExp.toLowerCase()) ||
                    userExp.toLowerCase().includes(exp.toLowerCase()));
                if (matchesUserInput && !uniqueExperiences.has(exp)) {
                    uniqueExperiences.add(exp);
                    recommendations.push({
                        type: 'experience',
                        title: `${exp} Experience`,
                        description: `Experience ${exp.toLowerCase()} in destinations like ${item.destination}. This activity is featured in Ken and Gail's bucket list.`,
                        reasoning: `This experience appears in the bucket list and matches your interest in ${travelInput.experiences.join(' and ')}`,
                        confidence: 0.8,
                        relatedTo: [exp, item.destination],
                        metadata: {
                            duration: Math.ceil(item.estimatedDuration / 3), // Portion of trip
                            difficulty: item.difficulty
                        }
                    });
                }
            });
        });
        return recommendations.slice(0, 3); // Limit to 3 experience recommendations
    }
    /**
     * Maps difficulty from user preferences
     */
    static mapDifficultyFromPreferences(preferences) {
        if (!preferences?.interests)
            return undefined;
        const interests = preferences.interests.map((i) => i.toLowerCase());
        if (interests.some((i) => ['adventure', 'extreme', 'challenging', 'hiking', 'climbing'].includes(i))) {
            return 'challenging';
        }
        if (interests.some((i) => ['moderate', 'active', 'walking', 'cultural'].includes(i))) {
            return 'moderate';
        }
        if (interests.some((i) => ['relaxation', 'easy', 'comfort', 'luxury'].includes(i))) {
            return 'easy';
        }
        return undefined;
    }
    /**
     * Maps duration from user preferences
     */
    static mapDurationFromPreferences(duration) {
        if (!duration)
            return undefined;
        const durationMap = {
            'short': 'short',
            'medium': 'medium',
            'long': 'long'
        };
        return durationMap[duration];
    }
    /**
     * Generates smart recommendations based on analysis
     */
    static generateSmartRecommendations(userProfile, travelInput) {
        const recommendations = [];
        // Analyze user input for patterns and generate complementary recommendations
        const inputAnalysis = this.analyzeUserInput(travelInput);
        // Generate recommendations based on analysis
        if (inputAnalysis.hasAdventureInterest) {
            recommendations.push({
                type: 'experience',
                title: 'Adventure Photography Workshop',
                description: 'Combine your love for adventure with photography skills. Learn to capture stunning landscapes and action shots during your travels.',
                reasoning: 'Based on your interest in adventure activities and the photographic opportunities in your chosen destinations',
                confidence: 0.7,
                relatedTo: ['adventure', 'photography', 'workshop'],
                metadata: {
                    duration: 2,
                    difficulty: 'moderate'
                }
            });
        }
        if (inputAnalysis.hasCulturalInterest) {
            recommendations.push({
                type: 'experience',
                title: 'Local Cooking Class Experience',
                description: 'Immerse yourself in local culture through authentic cooking classes with local families or professional chefs.',
                reasoning: 'Enhances your cultural exploration with hands-on culinary experiences',
                confidence: 0.75,
                relatedTo: ['culture', 'food', 'local experience'],
                metadata: {
                    duration: 1,
                    difficulty: 'easy'
                }
            });
        }
        return recommendations;
    }
    /**
     * Analyzes user input for patterns
     */
    static analyzeUserInput(travelInput) {
        const allText = [
            ...travelInput.destinations,
            ...travelInput.experiences,
            ...(travelInput.preferences?.interests || [])
        ].join(' ').toLowerCase();
        return {
            hasAdventureInterest: ['adventure', 'hiking', 'climbing', 'extreme', 'sport'].some(term => allText.includes(term)),
            hasCulturalInterest: ['culture', 'local', 'traditional', 'history', 'museum', 'heritage'].some(term => allText.includes(term)),
            hasNatureInterest: ['nature', 'wildlife', 'scenic', 'landscape', 'park', 'outdoor'].some(term => allText.includes(term)),
            hasRelaxationInterest: ['relax', 'spa', 'beach', 'luxury', 'comfort', 'peaceful'].some(term => allText.includes(term))
        };
    }
    /**
     * Generates smart follow-up questions based on input analysis
     */
    static async generateSmartFollowUpQuestions(travelInput, userProfile) {
        const questions = [];
        // Check for vague destinations
        const vagueDestinations = travelInput.destinations.filter((dest) => ['europe', 'asia', 'africa', 'america', 'world', 'everywhere'].some(term => dest.toLowerCase().includes(term)));
        vagueDestinations.forEach((dest, index) => {
            if (dest.toLowerCase().includes('europe')) {
                questions.push({
                    id: `europe-clarification-${index}`,
                    question: 'Which regions of Europe interest you most?',
                    type: 'multiple-choice',
                    options: [
                        'Western Europe (France, Germany, Netherlands)',
                        'Southern Europe (Italy, Spain, Greece)',
                        'Northern Europe (Scandinavia, UK)',
                        'Eastern Europe (Czech Republic, Poland, Hungary)',
                        'Mediterranean Islands (Sicily, Sardinia, Greek Islands)'
                    ],
                    required: true,
                    context: `Clarifying your interest in ${dest}`
                });
            }
            else if (dest.toLowerCase().includes('asia')) {
                questions.push({
                    id: `asia-clarification-${index}`,
                    question: 'Which parts of Asia would you like to explore?',
                    type: 'multiple-choice',
                    options: [
                        'Southeast Asia (Thailand, Vietnam, Indonesia)',
                        'East Asia (Japan, South Korea, China)',
                        'South Asia (India, Nepal, Sri Lanka)',
                        'Central Asia (Kazakhstan, Uzbekistan)',
                        'Middle East (UAE, Jordan, Israel)'
                    ],
                    required: true,
                    context: `Clarifying your interest in ${dest}`
                });
            }
        });
        // Check for vague experiences
        const vagueExperiences = travelInput.experiences.filter((exp) => ['adventure', 'fun', 'experience', 'activity', 'something'].some(term => exp.toLowerCase().includes(term) && exp.length < 20));
        if (vagueExperiences.length > 0) {
            questions.push({
                id: 'experience-specification',
                question: 'What specific types of activities excite you most?',
                type: 'multiple-choice',
                options: [
                    'Outdoor adventures (hiking, water sports, wildlife)',
                    'Cultural immersion (local traditions, festivals, communities)',
                    'Culinary experiences (cooking classes, food tours, markets)',
                    'Historical exploration (museums, ancient sites, architecture)',
                    'Relaxation and wellness (spas, beaches, meditation)',
                    'Photography and nature (landscapes, wildlife, scenic routes)',
                    'Urban exploration (nightlife, shopping, modern culture)',
                    'Adventure sports (climbing, diving, extreme activities)'
                ],
                required: true,
                context: 'Clarifying your activity preferences'
            });
        }
        // Check for missing or vague preferences
        if (!travelInput.preferences?.budgetRange ||
            (travelInput.preferences.budgetRange.min === 0 && travelInput.preferences.budgetRange.max === 0)) {
            questions.push({
                id: 'budget-specification',
                question: 'What is your approximate total budget for this trip?',
                type: 'multiple-choice',
                options: [
                    'Under $1,500 (Budget travel)',
                    '$1,500 - $3,500 (Mid-range comfort)',
                    '$3,500 - $7,500 (Premium experience)',
                    '$7,500 - $15,000 (Luxury travel)',
                    'Over $15,000 (Ultra-luxury)'
                ],
                required: true,
                context: 'Understanding your budget preferences'
            });
        }
        return questions;
    }
    /**
     * Processes follow-up answers and updates travel input
     */
    static processFollowUpAnswers(originalInput, answers) {
        const updatedInput = { ...originalInput };
        // Process destination clarifications
        Object.entries(answers).forEach(([questionId, answer]) => {
            if (questionId.includes('europe-clarification')) {
                // Replace vague "Europe" with specific regions
                const answerArray = Array.isArray(answer) ? answer : [answer];
                const specificDestinations = answerArray.map((region) => {
                    if (region.includes('Western Europe'))
                        return ['Paris, France', 'Amsterdam, Netherlands', 'Berlin, Germany'];
                    if (region.includes('Southern Europe'))
                        return ['Rome, Italy', 'Barcelona, Spain', 'Athens, Greece'];
                    if (region.includes('Northern Europe'))
                        return ['Stockholm, Sweden', 'London, UK', 'Copenhagen, Denmark'];
                    if (region.includes('Eastern Europe'))
                        return ['Prague, Czech Republic', 'Krakow, Poland', 'Budapest, Hungary'];
                    if (region.includes('Mediterranean'))
                        return ['Sicily, Italy', 'Santorini, Greece', 'Mallorca, Spain'];
                    return [];
                }).flat();
                // Replace vague destinations with specific ones
                updatedInput.destinations = updatedInput.destinations.map((dest) => dest.toLowerCase().includes('europe') ? specificDestinations : [dest]).flat();
            }
            if (questionId.includes('asia-clarification')) {
                const answerArray = Array.isArray(answer) ? answer : [answer];
                const specificDestinations = answerArray.map((region) => {
                    if (region.includes('Southeast Asia'))
                        return ['Bangkok, Thailand', 'Ho Chi Minh City, Vietnam', 'Bali, Indonesia'];
                    if (region.includes('East Asia'))
                        return ['Tokyo, Japan', 'Seoul, South Korea', 'Beijing, China'];
                    if (region.includes('South Asia'))
                        return ['Mumbai, India', 'Kathmandu, Nepal', 'Colombo, Sri Lanka'];
                    if (region.includes('Central Asia'))
                        return ['Almaty, Kazakhstan', 'Tashkent, Uzbekistan'];
                    if (region.includes('Middle East'))
                        return ['Dubai, UAE', 'Amman, Jordan', 'Tel Aviv, Israel'];
                    return [];
                }).flat();
                updatedInput.destinations = updatedInput.destinations.map((dest) => dest.toLowerCase().includes('asia') ? specificDestinations : [dest]).flat();
            }
            if (questionId === 'experience-specification') {
                const answerArray = Array.isArray(answer) ? answer : [answer];
                const specificExperiences = answerArray.map((type) => {
                    if (type.includes('Outdoor adventures'))
                        return ['Hiking mountain trails', 'Scuba diving', 'Wildlife safari'];
                    if (type.includes('Cultural immersion'))
                        return ['Local festival participation', 'Traditional craft workshops', 'Community homestays'];
                    if (type.includes('Culinary experiences'))
                        return ['Cooking classes with locals', 'Street food tours', 'Wine tasting'];
                    if (type.includes('Historical exploration'))
                        return ['Ancient ruins exploration', 'Museum visits', 'Architecture tours'];
                    if (type.includes('Relaxation'))
                        return ['Spa treatments', 'Beach relaxation', 'Meditation retreats'];
                    if (type.includes('Photography'))
                        return ['Landscape photography', 'Wildlife photography', 'Street photography'];
                    if (type.includes('Urban exploration'))
                        return ['Nightlife experiences', 'Local markets', 'Modern art galleries'];
                    if (type.includes('Adventure sports'))
                        return ['Rock climbing', 'Bungee jumping', 'Paragliding'];
                    return [];
                }).flat();
                // Replace vague experiences with specific ones
                updatedInput.experiences = [
                    ...updatedInput.experiences.filter((exp) => !['adventure', 'fun', 'experience', 'activity', 'something'].some(term => exp.toLowerCase().includes(term) && exp.length < 20)),
                    ...specificExperiences
                ];
            }
            if (questionId === 'budget-specification') {
                const budgetMapping = {
                    'Under $1,500': { min: 500, max: 1500 },
                    '$1,500 - $3,500': { min: 1500, max: 3500 },
                    '$3,500 - $7,500': { min: 3500, max: 7500 },
                    '$7,500 - $15,000': { min: 7500, max: 15000 },
                    'Over $15,000': { min: 15000, max: 50000 }
                };
                const selectedBudget = budgetMapping[answer];
                if (selectedBudget) {
                    updatedInput.preferences = {
                        ...updatedInput.preferences,
                        travelStyle: updatedInput.preferences?.travelStyle || 'mid-range',
                        interests: updatedInput.preferences?.interests || [],
                        travelDuration: updatedInput.preferences?.travelDuration || 'medium',
                        groupSize: updatedInput.preferences?.groupSize || 2,
                        budgetRange: {
                            min: selectedBudget.min,
                            max: selectedBudget.max,
                            currency: 'USD'
                        }
                    };
                }
            }
        });
        return updatedInput;
    }
}
exports.RecommendationEngine = RecommendationEngine;
RecommendationEngine.API_TIMEOUT = 30000; // 30 seconds
RecommendationEngine.MAX_RETRIES = 3;
//# sourceMappingURL=RecommendationEngine.js.map