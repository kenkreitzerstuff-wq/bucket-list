"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TravelInputService = void 0;
const LocationService_1 = require("./LocationService");
/**
 * TravelInputService handles validation and storage of travel input data
 */
class TravelInputService {
    /**
     * Validates travel input data
     */
    static validateTravelInput(input) {
        const errors = [];
        const warnings = [];
        // Validate destinations
        if (!input.destinations || input.destinations.length === 0) {
            errors.push('At least one destination is required');
        }
        else {
            // Check for empty or invalid destinations
            const invalidDestinations = input.destinations.filter(dest => !dest || dest.trim().length < 2);
            if (invalidDestinations.length > 0) {
                errors.push('All destinations must be at least 2 characters long');
            }
            // Check for duplicate destinations
            const uniqueDestinations = new Set(input.destinations.map(d => d.toLowerCase().trim()));
            if (uniqueDestinations.size !== input.destinations.length) {
                warnings.push('Some destinations appear to be duplicates');
            }
            // Check for vague destinations
            const vagueTerms = ['europe', 'asia', 'africa', 'america', 'world', 'everywhere', 'anywhere'];
            const vagueDestinations = input.destinations.filter(dest => vagueTerms.some(term => dest.toLowerCase().includes(term)));
            if (vagueDestinations.length > 0) {
                warnings.push(`Vague destinations detected: ${vagueDestinations.join(', ')}. Consider being more specific for better recommendations.`);
            }
        }
        // Validate experiences
        if (!input.experiences || input.experiences.length === 0) {
            errors.push('At least one experience or activity is required');
        }
        else {
            // Check for empty experiences
            const invalidExperiences = input.experiences.filter(exp => !exp || exp.trim().length < 2);
            if (invalidExperiences.length > 0) {
                errors.push('All experiences must be at least 2 characters long');
            }
            // Check for vague experiences
            const vagueExperiences = input.experiences.filter(exp => ['adventure', 'fun', 'experience', 'activity', 'something'].some(term => exp.toLowerCase().includes(term) && exp.toLowerCase().trim().length < 15));
            if (vagueExperiences.length > 0) {
                warnings.push(`Vague experiences detected: ${vagueExperiences.join(', ')}. Consider being more specific.`);
            }
        }
        // Validate preferences
        if (input.preferences) {
            const prefs = input.preferences;
            // Validate travel style
            const validStyles = ['budget', 'mid-range', 'luxury'];
            if (prefs.travelStyle && !validStyles.includes(prefs.travelStyle)) {
                errors.push('Invalid travel style. Must be budget, mid-range, or luxury');
            }
            // Validate travel duration
            const validDurations = ['short', 'medium', 'long'];
            if (prefs.travelDuration && !validDurations.includes(prefs.travelDuration)) {
                errors.push('Invalid travel duration. Must be short, medium, or long');
            }
            // Validate group size
            if (prefs.groupSize !== undefined) {
                if (prefs.groupSize < 1 || prefs.groupSize > 50) {
                    errors.push('Group size must be between 1 and 50');
                }
                if (prefs.groupSize > 10) {
                    warnings.push('Large groups may have limited accommodation and activity options');
                }
            }
            // Validate budget range
            if (prefs.budgetRange) {
                if (prefs.budgetRange.min < 0 || prefs.budgetRange.max < 0) {
                    errors.push('Budget amounts must be positive');
                }
                if (prefs.budgetRange.min >= prefs.budgetRange.max) {
                    errors.push('Maximum budget must be greater than minimum budget');
                }
                if (prefs.budgetRange.min < 100) {
                    warnings.push('Very low budget may limit travel options');
                }
                if (prefs.budgetRange.max > 50000) {
                    warnings.push('High budget detected - consider if this is accurate');
                }
            }
            // Validate interests
            if (prefs.interests && prefs.interests.length === 0) {
                warnings.push('No interests selected - this may limit recommendation quality');
            }
        }
        // Validate timeframe
        if (input.timeframe) {
            const { startDate, endDate, flexibility } = input.timeframe;
            // Validate flexibility
            const validFlexibility = ['fixed', 'flexible', 'very-flexible'];
            if (flexibility && !validFlexibility.includes(flexibility)) {
                errors.push('Invalid flexibility option');
            }
            // Validate dates if provided
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                const now = new Date();
                if (start >= end) {
                    errors.push('End date must be after start date');
                }
                if (start < now) {
                    warnings.push('Start date is in the past');
                }
                // Check trip duration
                const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                if (durationDays < 1) {
                    errors.push('Trip must be at least 1 day long');
                }
                else if (durationDays > 365) {
                    warnings.push('Very long trip duration detected - consider breaking into multiple trips');
                }
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Detects incomplete or vague input that needs follow-up questions
     */
    static detectIncompleteInput(input) {
        const incompleteAreas = [];
        const suggestions = [];
        // Check for vague destinations
        const vagueDestinationTerms = ['europe', 'asia', 'africa', 'america', 'world', 'everywhere', 'anywhere'];
        const vagueDestinations = input.destinations?.filter(dest => vagueDestinationTerms.some(term => dest.toLowerCase().includes(term))) || [];
        if (vagueDestinations.length > 0) {
            incompleteAreas.push('destinations');
            suggestions.push(`Specify which countries or cities in ${vagueDestinations.join(', ')}`);
        }
        // Check for vague experiences
        const vagueExperienceTerms = ['adventure', 'fun', 'experience', 'activity', 'something', 'anything'];
        const vagueExperiences = input.experiences?.filter(exp => vagueExperienceTerms.some(term => exp.toLowerCase().includes(term) && exp.toLowerCase().trim().length < 15)) || [];
        if (vagueExperiences.length > 0) {
            incompleteAreas.push('experiences');
            suggestions.push('Describe specific activities you want to do (e.g., "hiking", "museums", "local food tours")');
        }
        // Check for missing preferences
        if (!input.preferences?.travelStyle) {
            incompleteAreas.push('travel-style');
            suggestions.push('Specify your preferred travel style (budget, mid-range, or luxury)');
        }
        if (!input.preferences?.interests || input.preferences.interests.length === 0) {
            incompleteAreas.push('interests');
            suggestions.push('Select your travel interests to get better recommendations');
        }
        if (!input.preferences?.budgetRange ||
            (input.preferences.budgetRange.min === 0 && input.preferences.budgetRange.max === 0)) {
            incompleteAreas.push('budget');
            suggestions.push('Provide a budget range to get realistic recommendations');
        }
        // Check for missing timeframe details
        if (input.timeframe?.flexibility === 'fixed' && (!input.timeframe.startDate || !input.timeframe.endDate)) {
            incompleteAreas.push('dates');
            suggestions.push('Provide specific travel dates since you selected fixed dates');
        }
        return {
            needsFollowUp: incompleteAreas.length > 0,
            incompleteAreas,
            suggestions
        };
    }
    /**
     * Generates follow-up questions based on incomplete input
     */
    static generateFollowUpQuestions(input) {
        const questions = [];
        const incomplete = this.detectIncompleteInput(input);
        // Generate questions for vague destinations
        const vagueDestinations = input.destinations?.filter(dest => ['europe', 'asia', 'africa', 'america'].some(term => dest.toLowerCase().includes(term))) || [];
        vagueDestinations.forEach((dest, index) => {
            if (dest.toLowerCase().includes('europe')) {
                questions.push({
                    id: `destination-europe-${index}`,
                    question: `Which countries or regions in Europe interest you most?`,
                    type: 'multiple-choice',
                    options: ['Western Europe', 'Eastern Europe', 'Mediterranean', 'Scandinavia', 'Specific cities'],
                    context: `Clarifying vague destination: ${dest}`
                });
            }
            else if (dest.toLowerCase().includes('asia')) {
                questions.push({
                    id: `destination-asia-${index}`,
                    question: `Which parts of Asia would you like to explore?`,
                    type: 'multiple-choice',
                    options: ['Southeast Asia', 'East Asia', 'South Asia', 'Central Asia', 'Specific countries'],
                    context: `Clarifying vague destination: ${dest}`
                });
            }
        });
        // Generate questions for vague experiences
        const vagueExperiences = input.experiences?.filter(exp => ['adventure', 'fun', 'experience'].some(term => exp.toLowerCase().includes(term))) || [];
        if (vagueExperiences.length > 0) {
            questions.push({
                id: 'experience-clarification',
                question: 'What specific types of activities do you enjoy?',
                type: 'multiple-choice',
                options: [
                    'Outdoor activities (hiking, water sports)',
                    'Cultural experiences (museums, local traditions)',
                    'Food and drink experiences',
                    'Adventure sports (climbing, diving)',
                    'Relaxation and wellness',
                    'Photography and sightseeing'
                ],
                context: 'Clarifying vague experiences'
            });
        }
        // Generate questions for missing budget
        if (!input.preferences?.budgetRange ||
            (input.preferences.budgetRange.min === 0 && input.preferences.budgetRange.max === 0)) {
            questions.push({
                id: 'budget-range',
                question: 'What is your approximate budget range for this trip (in USD)?',
                type: 'multiple-choice',
                options: [
                    'Under $1,000',
                    '$1,000 - $3,000',
                    '$3,000 - $5,000',
                    '$5,000 - $10,000',
                    'Over $10,000'
                ],
                context: 'Missing budget information'
            });
        }
        // Generate questions for travel style if missing
        if (!input.preferences?.travelStyle) {
            questions.push({
                id: 'travel-style',
                question: 'How would you describe your preferred travel style?',
                type: 'multiple-choice',
                options: ['Budget-conscious', 'Comfortable mid-range', 'Luxury and premium'],
                context: 'Missing travel style preference'
            });
        }
        return questions;
    }
    /**
     * Stores travel input data in user profile
     */
    static storeTravelInput(userId, input) {
        const profile = LocationService_1.UserProfileStorage.getUserProfile(userId);
        // Update the profile with travel input data
        profile.travelInput = {
            destinations: input.destinations,
            experiences: input.experiences,
            preferences: input.preferences,
            timeframe: input.timeframe,
            lastUpdated: new Date().toISOString()
        };
        // Update preferences in the main profile structure
        if (input.preferences) {
            profile.preferences = {
                ...profile.preferences,
                ...input.preferences
            };
        }
        LocationService_1.UserProfileStorage.saveUserProfile(userId, profile);
    }
    /**
     * Retrieves stored travel input data
     */
    static getTravelInput(userId) {
        const profile = LocationService_1.UserProfileStorage.getUserProfile(userId);
        return profile.travelInput || null;
    }
    /**
     * Normalizes and cleans travel input data
     */
    static normalizeTravelInput(input) {
        return {
            destinations: input.destinations?.map(dest => dest.trim()).filter(dest => dest.length > 0) || [],
            experiences: input.experiences?.map(exp => exp.trim()).filter(exp => exp.length > 0) || [],
            preferences: input.preferences ? {
                ...input.preferences,
                interests: input.preferences.interests?.map(interest => interest.trim()) || []
            } : undefined,
            timeframe: input.timeframe
        };
    }
    /**
     * Calculates completeness score of travel input (0-100)
     */
    static calculateCompletenessScore(input) {
        let score = 0;
        let maxScore = 0;
        // Destinations (20 points)
        maxScore += 20;
        if (input.destinations && input.destinations.length > 0) {
            score += 15;
            // Bonus for specific (non-vague) destinations
            const specificDestinations = input.destinations.filter(dest => !['europe', 'asia', 'africa', 'america', 'world'].some(term => dest.toLowerCase().includes(term)));
            if (specificDestinations.length > 0) {
                score += 5;
            }
        }
        // Experiences (20 points)
        maxScore += 20;
        if (input.experiences && input.experiences.length > 0) {
            score += 15;
            // Bonus for specific experiences
            const specificExperiences = input.experiences.filter(exp => !['adventure', 'fun', 'experience', 'activity'].some(term => exp.toLowerCase().includes(term) && exp.length < 15));
            if (specificExperiences.length > 0) {
                score += 5;
            }
        }
        // Preferences (40 points total)
        maxScore += 40;
        if (input.preferences) {
            // Travel style (10 points)
            if (input.preferences.travelStyle)
                score += 10;
            // Interests (10 points)
            if (input.preferences.interests && input.preferences.interests.length > 0) {
                score += 10;
            }
            // Budget range (10 points)
            if (input.preferences.budgetRange &&
                input.preferences.budgetRange.min > 0 &&
                input.preferences.budgetRange.max > input.preferences.budgetRange.min) {
                score += 10;
            }
            // Group size and duration (10 points)
            if (input.preferences.groupSize && input.preferences.travelDuration) {
                score += 10;
            }
        }
        // Timeframe (20 points)
        maxScore += 20;
        if (input.timeframe) {
            score += 10; // Base points for having timeframe
            if (input.timeframe.flexibility === 'fixed' &&
                input.timeframe.startDate &&
                input.timeframe.endDate) {
                score += 10; // Bonus for specific dates
            }
            else if (input.timeframe.flexibility !== 'flexible') {
                score += 5; // Partial bonus for some specificity
            }
        }
        return Math.round((score / maxScore) * 100);
    }
}
exports.TravelInputService = TravelInputService;
//# sourceMappingURL=TravelInputService.js.map