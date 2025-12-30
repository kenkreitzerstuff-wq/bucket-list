import React, { useState, useEffect } from 'react';
import { LocationData, ValidationResult } from '../types';
import { locationApi } from '../services/locationApi';
import './HomeLocationSelector.css';

interface HomeLocationSelectorProps {
  location?: LocationData;
  onLocationChange: (location: LocationData) => void;
  onValidationError: (error: string) => void;
  className?: string;
}

interface LocationState {
  input: string;
  isValidating: boolean;
  isParsing: boolean;
  validation: ValidationResult | null;
  error: string | null;
  suggestions: string[];
}

export const HomeLocationSelector: React.FC<HomeLocationSelectorProps> = ({
  location,
  onLocationChange,
  onValidationError,
  className = ''
}) => {
  const [state, setState] = useState<LocationState>({
    input: '',
    isValidating: false,
    isParsing: false,
    validation: null,
    error: null,
    suggestions: []
  });

  // Initialize input with existing location
  useEffect(() => {
    if (location) {
      const displayText = location.airportCode 
        ? location.airportCode 
        : `${location.city}, ${location.country}`;
      setState(prev => ({ ...prev, input: displayText }));
    }
  }, [location]);

  // Validation debounce timer
  useEffect(() => {
    if (!state.input.trim()) {
      setState(prev => ({ ...prev, validation: null, error: null }));
      return;
    }

    const timer = setTimeout(async () => {
      await validateInput(state.input);
    }, 500);

    return () => clearTimeout(timer);
  }, [state.input]);

  const validateInput = async (input: string) => {
    if (!input.trim()) return;

    setState(prev => ({ ...prev, isValidating: true, error: null }));

    try {
      const response = await locationApi.validateLocation(input);
      
      setState(prev => ({
        ...prev,
        validation: response.validation,
        isValidating: false,
        suggestions: generateSuggestions(input, response.validation)
      }));

      if (!response.validation.isValid) {
        onValidationError(response.validation.errors.join(', '));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isValidating: false,
        validation: null
      }));
      onValidationError(errorMessage);
    }
  };

  const generateSuggestions = (input: string, validation: ValidationResult): string[] => {
    const suggestions: string[] = [];
    
    // If input looks like a city name without country, suggest adding country
    if (!input.includes(',') && input.length > 2 && validation.warnings?.some(w => w.includes('City, Country'))) {
      suggestions.push(`${input}, United States`);
      suggestions.push(`${input}, United Kingdom`);
      suggestions.push(`${input}, Canada`);
    }
    
    // If input has formatting issues, suggest corrections
    if (validation.warnings?.some(w => w.includes('capitalization'))) {
      const parts = input.split(',').map(part => 
        part.trim().split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ')
      );
      suggestions.push(parts.join(', '));
    }
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, input: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.input.trim()) {
      onValidationError('Please enter a location');
      return;
    }

    if (state.validation && !state.validation.isValid) {
      onValidationError('Please fix validation errors before submitting');
      return;
    }

    setState(prev => ({ ...prev, isParsing: true, error: null }));

    try {
      const response = await locationApi.parseLocation(state.input);
      onLocationChange(response.locationData);
      setState(prev => ({ ...prev, isParsing: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse location';
      setState(prev => ({ ...prev, error: errorMessage, isParsing: false }));
      onValidationError(errorMessage);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setState(prev => ({ ...prev, input: suggestion }));
  };

  const getInputClassName = () => {
    let className = 'location-input';
    
    if (state.isValidating) {
      className += ' validating';
    } else if (state.validation) {
      className += state.validation.isValid ? ' valid' : ' invalid';
    }
    
    return className;
  };

  const formatExamples = [
    'New York, United States',
    'London, United Kingdom', 
    'LAX (airport code)',
    '90210 (postal code)'
  ];

  return (
    <div className={`home-location-selector ${className}`}>
      <div className="location-form-container">
        <form onSubmit={handleSubmit} className="location-form">
          <div className="input-group">
            <label htmlFor="location-input" className="location-label">
              Home Location
              <span className="required">*</span>
            </label>
            
            <div className="input-container">
              <input
                id="location-input"
                type="text"
                value={state.input}
                onChange={handleInputChange}
                className={getInputClassName()}
                placeholder="Enter your home location..."
                disabled={state.isParsing}
                autoComplete="off"
              />
              
              {state.isValidating && (
                <div className="input-spinner">
                  <div className="spinner"></div>
                </div>
              )}
            </div>
            
            <div className="input-help">
              <p>Supported formats:</p>
              <ul className="format-examples">
                {formatExamples.map((example, index) => (
                  <li key={index} className="format-example">
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Validation Messages */}
          {state.validation && (
            <div className={`validation-feedback ${state.validation.isValid ? 'valid' : 'invalid'}`}>
              {state.validation.isValid ? (
                <div className="success-message">
                  ✓ Location format is valid
                  {state.validation.warnings && state.validation.warnings.length > 0 && (
                    <div className="warnings">
                      {state.validation.warnings.map((warning, index) => (
                        <div key={index} className="warning">⚠ {warning}</div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="error-messages">
                  {state.validation.errors.map((error, index) => (
                    <div key={index} className="error">✗ {error}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Suggestions */}
          {state.suggestions.length > 0 && (
            <div className="suggestions">
              <p className="suggestions-label">Did you mean:</p>
              <div className="suggestion-buttons">
                {state.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="suggestion-button"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {state.error && (
            <div className="error-display">
              <div className="error-message">
                ⚠ {state.error}
              </div>
            </div>
          )}

          {/* Current Location Display */}
          {location && (
            <div className="current-location">
              <h4>Current Home Location:</h4>
              <div className="location-details">
                <div className="location-primary">
                  {location.city}, {location.country}
                </div>
                <div className="location-secondary">
                  {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
                  {location.airportCode && (
                    <span className="airport-code">• {location.airportCode}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="submit-button"
            disabled={
              !state.input.trim() || 
              state.isValidating || 
              state.isParsing || 
              (state.validation ? !state.validation.isValid : false)
            }
          >
            {state.isParsing ? (
              <>
                <div className="button-spinner"></div>
                Processing...
              </>
            ) : (
              location ? 'Update Location' : 'Set Home Location'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};