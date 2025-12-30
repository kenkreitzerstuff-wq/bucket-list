export interface UserProfile {
    id: string;
    homeLocation: LocationData;
    preferences: TravelPreferences;
    bucketList: BucketItem[];
}
export interface LocationData {
    city: string;
    country: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    airportCode?: string | null;
}
export interface TravelPreferences {
    budgetRange?: CostRange;
    travelStyle?: 'budget' | 'mid-range' | 'luxury' | 'adventure';
    interests?: string[];
    travelDuration?: 'short' | 'medium' | 'long';
    groupSize?: number;
    accessibility?: string[];
    homeLocation?: LocationData;
}
export interface BucketItem {
    id: string;
    destination: string;
    experiences: string[];
    estimatedDuration: number;
    costEstimate: CostRange;
    priority: number;
    status: 'planned' | 'booked' | 'completed';
    notes?: string;
}
export interface Recommendation {
    type: 'destination' | 'experience';
    title: string;
    description: string;
    reasoning: string;
    confidence: number;
    relatedTo: string[];
    metadata?: {
        season?: string;
        duration?: number;
        difficulty?: 'easy' | 'moderate' | 'challenging';
    };
}
export interface CostEstimate {
    transportation: CostRange;
    accommodation: CostRange;
    activities: CostRange;
    food: CostRange;
    total: CostRange;
    currency: string;
    lastUpdated: Date;
}
export interface CostRange {
    min: number;
    max: number;
    currency: string;
}
export interface TripData {
    destinations: string[];
    experiences: string[];
    duration: number;
    startDate?: Date | null;
    endDate?: Date | null;
    travelers: number;
}
export interface TripPlan {
    destinations: DestinationPlan[];
    totalDuration: number;
    totalCost: CostEstimate;
    suggestedRoute: string[];
    travelTimes: {
        [key: string]: number;
    };
}
export interface DestinationPlan {
    destination: string;
    suggestedDuration: number;
    experiences: string[];
    bestTimeToVisit: string;
    estimatedCost: CostEstimate;
}
export interface DestinationData {
    name: string;
    country: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    description: string;
    popularExperiences: string[];
    bestTimeToVisit: string[];
    averageCosts: CostEstimate;
    travelInfo: {
        visaRequired: boolean;
        language: string[];
        currency: string;
        timeZone: string;
    };
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
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
}
export interface TravelInputData {
    destinations: string[];
    experiences: string[];
    preferences?: TravelPreferences;
    timeframe?: {
        flexibility: 'flexible' | 'fixed' | 'seasonal' | 'very-flexible';
        preferredMonths?: number[] | string[];
        duration?: number;
        startDate?: Date;
        endDate?: Date;
    };
}
export interface FollowUpQuestion {
    id: string;
    question: string;
    type: 'multiple-choice' | 'text' | 'range' | 'date';
    options?: string[];
    required: boolean;
    context: string;
}
export interface FollowUpResponse {
    questionId: string;
    answer: string | number | Date;
    confidence?: number;
}
export interface ProgressState {
    currentStep: 'input' | 'clarification' | 'recommendations' | 'finalization' | 'planning';
    completedSteps: string[];
    totalSteps: number;
    stepProgress: {
        [key: string]: number;
    };
}
export interface SystemError {
    type: 'validation' | 'api' | 'network' | 'storage' | 'ai';
    message: string;
    code: string;
    statusCode?: number;
    details?: any;
    timestamp: Date;
    recoverable: boolean;
}
//# sourceMappingURL=shared-types.d.ts.map