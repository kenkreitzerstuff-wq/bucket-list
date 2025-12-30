// Re-export shared types for backend use
export * from './shared-types';

// Backend-specific types
export interface ServiceConfig {
  openaiApiKey?: string;
  travelApiKey?: string;
  maxRetries: number;
  timeoutMs: number;
}

export interface DatabaseConfig {
  type: 'memory' | 'file' | 'database';
  connectionString?: string;
  filePath?: string;
}

// Service interfaces
export interface IRecommendationEngine {
  generateRecommendations(userProfile: UserProfile): Promise<Recommendation[]>;
  generateFollowUpQuestions(input: string[], context: any): Promise<FollowUpQuestion[]>;
}

export interface ITravelDataService {
  getDestinationInfo(location: string): Promise<DestinationData>;
  validateLocation(location: string): Promise<ValidationResult>;
  searchDestinations(query: string): Promise<DestinationData[]>;
}

export interface ICostEstimator {
  estimateCosts(trip: TripData, homeLocation: LocationData): Promise<CostEstimate>;
  updateCostEstimate(tripId: string): Promise<CostEstimate>;
}

export interface ITripPlanner {
  planTrip(destinations: string[], preferences: TravelPreferences): Promise<TripPlan>;
  optimizeRoute(destinations: string[], homeLocation: LocationData): Promise<string[]>;
}

// Import shared types for convenience
import {
  UserProfile,
  LocationData,
  BucketItem,
  Recommendation,
  CostEstimate,
  TripData,
  TripPlan,
  DestinationData,
  ValidationResult,
  FollowUpQuestion,
  TravelPreferences
} from './shared-types';