import React, { useState, useEffect } from 'react';
import { TravelInputData, TravelPreferences } from '../types';
import './TravelInputForm.css';

interface TravelInputFormProps {
  onSubmit: (data: TravelInputData) => void;
  initialData?: Partial<TravelInputData>;
  isLoading?: boolean;
  className?: string;
}

interface FormState {
  destinations: string[];
  experiences: string[];
  preferences: Partial<TravelPreferences>;
  timeframe: {
    startDate?: Date;
    endDate?: Date;
    flexibility: 'flexible' | 'fixed' | 'seasonal' | 'very-flexible';
    preferredMonths?: number[] | string[];
    duration?: number;
  };
  currentStep: number;
  errors: { [key: string]: string };
  isValid: boolean;
}

const STEPS = [
  { id: 1, title: 'Destinations', description: 'Where do you want to go?' },
  { id: 2, title: 'Experiences', description: 'What do you want to do?' },
  { id: 3, title: 'Preferences', description: 'Tell us about your travel style' },
  { id: 4, title: 'Timeframe', description: 'When are you planning to travel?' }
];

const TRAVEL_STYLES = [
  { value: 'budget', label: 'Budget', description: 'Affordable options, hostels, local transport' },
  { value: 'mid-range', label: 'Mid-range', description: 'Comfortable hotels, mix of experiences' },
  { value: 'luxury', label: 'Luxury', description: 'Premium accommodations and experiences' }
] as const;

const TRAVEL_DURATIONS = [
  { value: 'short', label: 'Short trips', description: '1-2 weeks' },
  { value: 'medium', label: 'Medium trips', description: '2-4 weeks' },
  { value: 'long', label: 'Long trips', description: '1+ months' }
] as const;

const COMMON_INTERESTS = [
  'Adventure', 'Culture', 'Food', 'History', 'Nature', 'Photography',
  'Art', 'Music', 'Architecture', 'Wildlife', 'Beaches', 'Mountains',
  'Cities', 'Nightlife', 'Shopping', 'Relaxation', 'Sports', 'Festivals'
];

export const TravelInputForm: React.FC<TravelInputFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
  className = ''
}) => {
  const [state, setState] = useState<FormState>({
    destinations: initialData?.destinations || [],
    experiences: initialData?.experiences || [],
    preferences: initialData?.preferences || {
      budgetRange: { min: 1000, max: 5000, currency: 'USD' },
      travelStyle: 'mid-range',
      interests: [],
      travelDuration: 'medium',
      groupSize: 1
    },
    timeframe: initialData?.timeframe || {
      flexibility: 'flexible'
    },
    currentStep: 1,
    errors: {},
    isValid: false
  });

  const [newDestination, setNewDestination] = useState('');
  const [newExperience, setNewExperience] = useState('');

  useEffect(() => {
    validateCurrentStep();
  }, [state.currentStep, state.destinations, state.experiences, state.preferences, state.timeframe]);

  const validateCurrentStep = () => {
    const errors: { [key: string]: string } = {};
    let isValid = true;

    switch (state.currentStep) {
      case 1: // Destinations
        if (state.destinations.length === 0) {
          errors.destinations = 'Please add at least one destination';
          isValid = false;
        }
        break;
      
      case 2: // Experiences
        if (state.experiences.length === 0) {
          errors.experiences = 'Please add at least one experience or activity';
          isValid = false;
        }
        break;
      
      case 3: // Preferences
        if (!state.preferences.travelStyle) {
          errors.travelStyle = 'Please select a travel style';
          isValid = false;
        }
        if (!state.preferences.interests || state.preferences.interests.length === 0) {
          errors.interests = 'Please select at least one interest';
          isValid = false;
        }
        if (!state.preferences.groupSize || state.preferences.groupSize < 1) {
          errors.groupSize = 'Group size must be at least 1';
          isValid = false;
        }
        break;
      
      case 4: // Timeframe
        if (state.timeframe.startDate && state.timeframe.endDate) {
          if (state.timeframe.startDate >= state.timeframe.endDate) {
            errors.timeframe = 'End date must be after start date';
            isValid = false;
          }
        }
        break;
    }

    setState(prev => ({ ...prev, errors, isValid }));
  };

  const addDestination = () => {
    if (newDestination.trim() && !state.destinations.includes(newDestination.trim())) {
      setState(prev => ({
        ...prev,
        destinations: [...prev.destinations, newDestination.trim()]
      }));
      setNewDestination('');
    }
  };

  const removeDestination = (index: number) => {
    setState(prev => ({
      ...prev,
      destinations: prev.destinations.filter((_, i) => i !== index)
    }));
  };

  const addExperience = () => {
    if (newExperience.trim() && !state.experiences.includes(newExperience.trim())) {
      setState(prev => ({
        ...prev,
        experiences: [...prev.experiences, newExperience.trim()]
      }));
      setNewExperience('');
    }
  };

  const removeExperience = (index: number) => {
    setState(prev => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index)
    }));
  };

  const toggleInterest = (interest: string) => {
    setState(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        interests: prev.preferences.interests?.includes(interest)
          ? prev.preferences.interests.filter((i: string) => i !== interest)
          : [...(prev.preferences.interests || []), interest]
      }
    }));
  };

  const updatePreferences = (updates: Partial<TravelPreferences>) => {
    setState(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...updates }
    }));
  };

  const updateTimeframe = (updates: Partial<typeof state.timeframe>) => {
    setState(prev => ({
      ...prev,
      timeframe: { ...prev.timeframe, ...updates }
    }));
  };

  const nextStep = () => {
    if (state.isValid && state.currentStep < STEPS.length) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  };

  const prevStep = () => {
    if (state.currentStep > 1) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.isValid) return;

    const formData: TravelInputData = {
      destinations: state.destinations,
      experiences: state.experiences,
      preferences: state.preferences as TravelPreferences,
      timeframe: state.timeframe
    };

    onSubmit(formData);
  };

  const renderProgressBar = () => (
    <div className="progress-container">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${(state.currentStep / STEPS.length) * 100}%` }}
        />
      </div>
      <div className="progress-steps">
        {STEPS.map((step) => (
          <div 
            key={step.id}
            className={`progress-step ${state.currentStep >= step.id ? 'completed' : ''} ${state.currentStep === step.id ? 'active' : ''}`}
          >
            <div className="step-number">{step.id}</div>
            <div className="step-info">
              <div className="step-title">{step.title}</div>
              <div className="step-description">{step.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDestinationsStep = () => (
    <div className="form-step">
      <h3>Where do you want to go?</h3>
      <p>Add destinations you'd like to visit. You can be specific (Paris, France) or general (Europe).</p>
      
      <div className="input-group">
        <div className="add-item-container">
          <input
            type="text"
            value={newDestination}
            onChange={(e) => setNewDestination(e.target.value)}
            placeholder="Enter a destination..."
            className="add-item-input"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDestination())}
          />
          <button 
            type="button" 
            onClick={addDestination}
            className="add-item-button"
            disabled={!newDestination.trim()}
          >
            Add
          </button>
        </div>
        
        {state.errors.destinations && (
          <div className="error-message">{state.errors.destinations}</div>
        )}
        
        <div className="items-list">
          {state.destinations.map((destination, index) => (
            <div key={index} className="item-tag">
              <span>{destination}</span>
              <button 
                type="button" 
                onClick={() => removeDestination(index)}
                className="remove-item"
                aria-label={`Remove ${destination}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderExperiencesStep = () => (
    <div className="form-step">
      <h3>What do you want to do?</h3>
      <p>Describe the experiences, activities, or types of travel you're interested in.</p>
      
      <div className="input-group">
        <div className="add-item-container">
          <input
            type="text"
            value={newExperience}
            onChange={(e) => setNewExperience(e.target.value)}
            placeholder="Enter an experience or activity..."
            className="add-item-input"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExperience())}
          />
          <button 
            type="button" 
            onClick={addExperience}
            className="add-item-button"
            disabled={!newExperience.trim()}
          >
            Add
          </button>
        </div>
        
        {state.errors.experiences && (
          <div className="error-message">{state.errors.experiences}</div>
        )}
        
        <div className="items-list">
          {state.experiences.map((experience, index) => (
            <div key={index} className="item-tag">
              <span>{experience}</span>
              <button 
                type="button" 
                onClick={() => removeExperience(index)}
                className="remove-item"
                aria-label={`Remove ${experience}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPreferencesStep = () => (
    <div className="form-step">
      <h3>Tell us about your travel style</h3>
      
      <div className="preference-section">
        <label className="section-label">Travel Style</label>
        {state.errors.travelStyle && (
          <div className="error-message">{state.errors.travelStyle}</div>
        )}
        <div className="radio-group">
          {TRAVEL_STYLES.map((style) => (
            <label key={style.value} className="radio-option">
              <input
                type="radio"
                name="travelStyle"
                value={style.value}
                checked={state.preferences.travelStyle === style.value}
                onChange={(e) => updatePreferences({ travelStyle: e.target.value as any })}
              />
              <div className="radio-content">
                <div className="radio-title">{style.label}</div>
                <div className="radio-description">{style.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="preference-section">
        <label className="section-label">Trip Duration Preference</label>
        <div className="radio-group">
          {TRAVEL_DURATIONS.map((duration) => (
            <label key={duration.value} className="radio-option">
              <input
                type="radio"
                name="travelDuration"
                value={duration.value}
                checked={state.preferences.travelDuration === duration.value}
                onChange={(e) => updatePreferences({ travelDuration: e.target.value as any })}
              />
              <div className="radio-content">
                <div className="radio-title">{duration.label}</div>
                <div className="radio-description">{duration.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="preference-section">
        <label className="section-label">Interests</label>
        {state.errors.interests && (
          <div className="error-message">{state.errors.interests}</div>
        )}
        <div className="interests-grid">
          {COMMON_INTERESTS.map((interest) => (
            <button
              key={interest}
              type="button"
              className={`interest-tag ${state.preferences.interests?.includes(interest) ? 'selected' : ''}`}
              onClick={() => toggleInterest(interest)}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      <div className="preference-section">
        <label className="section-label">Group Size</label>
        {state.errors.groupSize && (
          <div className="error-message">{state.errors.groupSize}</div>
        )}
        <input
          type="number"
          min="1"
          max="20"
          value={state.preferences.groupSize || 1}
          onChange={(e) => updatePreferences({ groupSize: parseInt(e.target.value) || 1 })}
          className="number-input"
        />
      </div>

      <div className="preference-section">
        <label className="section-label">Budget Range (USD)</label>
        <div className="budget-inputs">
          <input
            type="number"
            min="0"
            step="100"
            value={state.preferences.budgetRange?.min || 1000}
            onChange={(e) => updatePreferences({
              budgetRange: {
                ...state.preferences.budgetRange!,
                min: parseInt(e.target.value) || 0
              }
            })}
            className="budget-input"
            placeholder="Min budget"
          />
          <span className="budget-separator">to</span>
          <input
            type="number"
            min="0"
            step="100"
            value={state.preferences.budgetRange?.max || 5000}
            onChange={(e) => updatePreferences({
              budgetRange: {
                ...state.preferences.budgetRange!,
                max: parseInt(e.target.value) || 0
              }
            })}
            className="budget-input"
            placeholder="Max budget"
          />
        </div>
      </div>
    </div>
  );

  const renderTimeframeStep = () => (
    <div className="form-step">
      <h3>When are you planning to travel?</h3>
      
      <div className="preference-section">
        <label className="section-label">Flexibility</label>
        <div className="radio-group">
          <label className="radio-option">
            <input
              type="radio"
              name="flexibility"
              value="fixed"
              checked={state.timeframe.flexibility === 'fixed'}
              onChange={(e) => updateTimeframe({ flexibility: e.target.value as any })}
            />
            <div className="radio-content">
              <div className="radio-title">Fixed dates</div>
              <div className="radio-description">I have specific travel dates</div>
            </div>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="flexibility"
              value="flexible"
              checked={state.timeframe.flexibility === 'flexible'}
              onChange={(e) => updateTimeframe({ flexibility: e.target.value as any })}
            />
            <div className="radio-content">
              <div className="radio-title">Flexible</div>
              <div className="radio-description">I can adjust dates by a few weeks</div>
            </div>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="flexibility"
              value="seasonal"
              checked={state.timeframe.flexibility === 'seasonal'}
              onChange={(e) => updateTimeframe({ flexibility: e.target.value as any })}
            />
            <div className="radio-content">
              <div className="radio-title">Seasonal</div>
              <div className="radio-description">I prefer specific seasons or months</div>
            </div>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="flexibility"
              value="very-flexible"
              checked={state.timeframe.flexibility === 'very-flexible'}
              onChange={(e) => updateTimeframe({ flexibility: e.target.value as any })}
            />
            <div className="radio-content">
              <div className="radio-title">Very flexible</div>
              <div className="radio-description">I'm open to any time of year</div>
            </div>
          </label>
        </div>
      </div>

      {state.timeframe.flexibility !== 'very-flexible' && (
        <div className="preference-section">
          <label className="section-label">Travel Dates (Optional)</label>
          {state.errors.timeframe && (
            <div className="error-message">{state.errors.timeframe}</div>
          )}
          <div className="date-inputs">
            <div className="date-input-group">
              <label>Start Date</label>
              <input
                type="date"
                value={state.timeframe.startDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => updateTimeframe({ 
                  startDate: e.target.value ? new Date(e.target.value) : undefined 
                })}
                className="date-input"
              />
            </div>
            <div className="date-input-group">
              <label>End Date</label>
              <input
                type="date"
                value={state.timeframe.endDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => updateTimeframe({ 
                  endDate: e.target.value ? new Date(e.target.value) : undefined 
                })}
                className="date-input"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 1: return renderDestinationsStep();
      case 2: return renderExperiencesStep();
      case 3: return renderPreferencesStep();
      case 4: return renderTimeframeStep();
      default: return null;
    }
  };

  return (
    <div className={`travel-input-form ${className}`}>
      <form onSubmit={handleSubmit}>
        {renderProgressBar()}
        
        <div className="form-content">
          {renderCurrentStep()}
        </div>

        <div className="form-navigation">
          <button
            type="button"
            onClick={prevStep}
            disabled={state.currentStep === 1}
            className="nav-button prev-button"
          >
            Previous
          </button>
          
          {state.currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!state.isValid}
              className="nav-button next-button"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={!state.isValid || isLoading}
              className="nav-button submit-button"
            >
              {isLoading ? (
                <>
                  <div className="button-spinner"></div>
                  Processing...
                </>
              ) : (
                'Complete Setup'
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};