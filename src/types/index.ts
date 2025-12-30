// Re-export shared types for frontend use
export * from '../../../shared/types';

// Import shared types for use in frontend-specific interfaces
import {
  UserProfile,
  LocationData,
  BucketItem,
  Recommendation,
  CostEstimate,
  TravelInputData,
  FollowUpQuestion,
  ProgressState,
  SystemError
} from '../../../shared/types';

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