// Shared types (copied from shared/types.ts for Vercel deployment)
export interface UserProfile {
  id: string;
  homeLocation: LocationData;
  preferences: TravelPreferences;
  bucketList: BucketItem[];
}

export interface LocationData {
  city: string;
  country: string;
  coordinates: { lat: number; lng: number };
  airportCode?: string | null;
}

export interface TravelPreferences {
  budgetRange?: CostRange;
  travelStyle?: 'budget' | 'mid-range' | 'luxury' | 'adventure';
  interests?: string[];
  travelDuration?: 'short' | 'medium' | 'long'; // weeks
  groupSize?: number;
  accessibility?: string[];
  homeLocation?: LocationData;
}

export interface BucketItem {
  id: string;
  destination: string;
  experiences: string[];
  estimatedDuration: number; // days
  costEstimate: CostRange;
  priority: number; // 1-5 scale
  status: 'planned' | 'booked' | 'completed';
  notes?: string;
}

export interface Recommendation {
  type: 'destination' | 'experience';
  title: string;
  description: string;
  reasoning: string;
  confidence: number; // 0-1 scale
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
  duration: number; // days
  startDate?: Date | null;
  endDate?: Date | null;
  travelers: number;
}

export interface TripPlan {
  destinations: DestinationPlan[];
  totalDuration: number;
  totalCost: CostEstimate;
  suggestedRoute: string[];
  travelTimes: { [key: string]: number }; // hours between destinations
}

export interface DestinationPlan {
  destination: string;
  suggestedDuration: number; // days
  experiences: string[];
  bestTimeToVisit: string;
  estimatedCost: CostEstimate;
}

export interface DestinationData {
  name: string;
  country: string;
  coordinates: { lat: number; lng: number };
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

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

// Input validation types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Travel input data structure
export interface TravelInputData {
  destinations: string[];
  experiences: string[];
  preferences?: TravelPreferences;
  timeframe?: {
    flexibility: 'flexible' | 'fixed' | 'seasonal' | 'very-flexible';
    preferredMonths?: number[] | string[];
    duration?: number; // days
    startDate?: Date;
    endDate?: Date;
  };
}

// Follow-up question types
export interface FollowUpQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'text' | 'range' | 'date';
  options?: string[];
  required: boolean;
  context: string; // what triggered this question
}

export interface FollowUpResponse {
  questionId: string;
  answer: string | number | Date;
  confidence?: number;
}

// Progress tracking
export interface ProgressState {
  currentStep: 'input' | 'clarification' | 'recommendations' | 'finalization' | 'planning';
  completedSteps: string[];
  totalSteps: number;
  stepProgress: { [key: string]: number }; // 0-100 percentage
}

// Error types
export interface SystemError {
  type: 'validation' | 'api' | 'network' | 'storage' | 'ai';
  message: string;
  code: string;
  statusCode?: number;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
}

// Frontend-specific types
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface FormState<T> {
  data: T;
  errors: { [key: string]: string };
  isSubmitting: boolean;
  isValid: boolean;
}

export interface ApiClient {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, data: any): Promise<T>;
  put<T>(url: string, data: any): Promise<T>;
  delete<T>(url: string): Promise<T>;
}

// Component-specific prop types
export interface TravelInputFormProps extends ComponentProps {
  onSubmit: (data: TravelInputData) => void;
  initialData?: Partial<TravelInputData>;
  isLoading?: boolean;
}

export interface RecommendationDisplayProps extends ComponentProps {
  recommendations: Recommendation[];
  onAccept: (recommendation: Recommendation) => void;
  onReject: (recommendation: Recommendation) => void;
  onModify: (recommendation: Recommendation, changes: Partial<Recommendation>) => void;
}

export interface BucketListManagerProps extends ComponentProps {
  bucketList: BucketItem[];
  onAdd: (item: BucketItem) => void;
  onRemove: (itemId: string) => void;
  onUpdate: (itemId: string, updates: Partial<BucketItem>) => void;
  costEstimates?: { [itemId: string]: CostEstimate };
}

export interface HomeLocationSelectorProps extends ComponentProps {
  location?: LocationData;
  onLocationChange: (location: LocationData) => void;
  onValidationError: (error: string) => void;
}

// UI State types
export interface AppState {
  user: UserProfile | null;
  currentStep: 'input' | 'clarification' | 'recommendations' | 'finalization' | 'planning';
  progress: ProgressState;
  recommendations: Recommendation[];
  followUpQuestions: FollowUpQuestion[];
  errors: SystemError[];
  isLoading: boolean;
}