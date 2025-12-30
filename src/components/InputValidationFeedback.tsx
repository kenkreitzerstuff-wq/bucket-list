import React, { useState, useEffect } from 'react';
import { TravelInputData, ValidationResult } from '../types';
import { travelInputApi } from '../services/travelInputApi';
import './InputValidationFeedback.css';

interface InputValidationFeedbackProps {
  travelInput: TravelInputData;
  onValidationChange: (validation: ValidationResult, completenessScore: number) => void;
  className?: string;
}

interface ValidationState {
  validation: ValidationResult | null;
  completenessScore: number;
  isValidating: boolean;
  suggestions: string[];
  needsFollowUp: boolean;
  error: string | null;
}

export const InputValidationFeedback: React.FC<InputValidationFeedbackProps> = ({
  travelInput,
  onValidationChange,
  className = ''
}) => {
  const [state, setState] = useState<ValidationState>({
    validation: null,
    completenessScore: 0,
    isValidating: false,
    suggestions: [],
    needsFollowUp: false,
    error: null
  });

  // Debounce validation to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      validateInput();
    }, 800);

    return () => clearTimeout(timer);
  }, [travelInput]);

  const validateInput = async () => {
    // Don't validate if input is completely empty
    if (!travelInput.destinations?.length && !travelInput.experiences?.length) {
      setState(prev => ({
        ...prev,
        validation: null,
        completenessScore: 0,
        isValidating: false,
        suggestions: [],
        needsFollowUp: false,
        error: null
      }));
      return;
    }

    setState(prev => ({ ...prev, isValidating: true, error: null }));

    try {
      const response = await travelInputApi.validateAndScore(travelInput);
      
      const validation: ValidationResult = {
        isValid: response.isValid,
        errors: response.errors,
        warnings: response.warnings
      };

      setState(prev => ({
        ...prev,
        validation,
        completenessScore: response.completenessScore,
        suggestions: response.suggestions,
        needsFollowUp: response.needsFollowUp,
        isValidating: false
      }));

      onValidationChange(validation, response.completenessScore);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isValidating: false
      }));
    }
  };

  const getCompletenessColor = (score: number): string => {
    if (score >= 80) return '#51cf66'; // Green
    if (score >= 60) return '#ffd93d'; // Yellow
    if (score >= 40) return '#ff9f43'; // Orange
    return '#ff6b6b'; // Red
  };

  const getCompletenessLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs improvement';
  };

  const renderCompletenessScore = () => {
    if (state.completenessScore === 0) return null;

    const color = getCompletenessColor(state.completenessScore);
    const label = getCompletenessLabel(state.completenessScore);

    return (
      <div className="completeness-section">
        <div className="completeness-header">
          <h4>Input Completeness</h4>
          <div className="completeness-score" style={{ color }}>
            {state.completenessScore}% - {label}
          </div>
        </div>
        
        <div className="completeness-bar">
          <div 
            className="completeness-fill" 
            style={{ 
              width: `${state.completenessScore}%`,
              backgroundColor: color
            }}
          />
        </div>
        
        {state.completenessScore < 80 && (
          <div className="completeness-tip">
            <span className="tip-icon">💡</span>
            <span>Add more specific details to get better recommendations</span>
          </div>
        )}
      </div>
    );
  };

  const renderValidationMessages = () => {
    if (!state.validation) return null;

    return (
      <div className="validation-messages">
        {/* Errors */}
        {state.validation.errors.length > 0 && (
          <div className="validation-group errors">
            <h5 className="validation-title">
              <span className="validation-icon error-icon">⚠</span>
              Issues to Fix
            </h5>
            <ul className="validation-list">
              {state.validation.errors.map((error, index) => (
                <li key={index} className="validation-item error">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {state.validation.warnings && state.validation.warnings.length > 0 && (
          <div className="validation-group warnings">
            <h5 className="validation-title">
              <span className="validation-icon warning-icon">⚡</span>
              Suggestions
            </h5>
            <ul className="validation-list">
              {state.validation.warnings.map((warning, index) => (
                <li key={index} className="validation-item warning">
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Success */}
        {state.validation.isValid && state.validation.errors.length === 0 && (
          <div className="validation-group success">
            <h5 className="validation-title">
              <span className="validation-icon success-icon">✓</span>
              Looking Good!
            </h5>
            <p className="validation-success-message">
              Your travel input is valid and ready for processing.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderSuggestions = () => {
    if (state.suggestions.length === 0) return null;

    return (
      <div className="suggestions-section">
        <h4 className="suggestions-title">
          <span className="suggestions-icon">🎯</span>
          Recommendations for Better Results
        </h4>
        <ul className="suggestions-list">
          {state.suggestions.map((suggestion, index) => (
            <li key={index} className="suggestion-item">
              {suggestion}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderFollowUpPrompt = () => {
    if (!state.needsFollowUp) return null;

    return (
      <div className="follow-up-prompt">
        <div className="follow-up-content">
          <div className="follow-up-icon">🤔</div>
          <div className="follow-up-text">
            <h4>We have some follow-up questions</h4>
            <p>
              Your input contains some general terms that we'd like to clarify 
              to provide more personalized recommendations.
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (state.error) {
    return (
      <div className={`input-validation-feedback error ${className}`}>
        <div className="error-container">
          <span className="error-icon">⚠</span>
          <span className="error-message">{state.error}</span>
          <button onClick={validateInput} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (state.isValidating) {
    return (
      <div className={`input-validation-feedback validating ${className}`}>
        <div className="validating-container">
          <div className="spinner"></div>
          <span>Analyzing your input...</span>
        </div>
      </div>
    );
  }

  if (!state.validation && state.completenessScore === 0) {
    return null; // Don't show anything if there's no input to validate
  }

  return (
    <div className={`input-validation-feedback ${className}`}>
      {renderCompletenessScore()}
      {renderValidationMessages()}
      {renderSuggestions()}
      {renderFollowUpPrompt()}
    </div>
  );
};