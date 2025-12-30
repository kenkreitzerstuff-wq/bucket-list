import React from 'react';
import './ProgressIndicator.css';

export interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  isOptional?: boolean;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStepId: string;
  showDescriptions?: boolean;
  variant?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStepId,
  showDescriptions = false,
  variant = 'horizontal',
  size = 'medium',
  className = ''
}) => {
  const currentStepIndex = steps.findIndex(step => step.id === currentStepId);
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  const getStepIcon = (step: ProgressStep, index: number) => {
    switch (step.status) {
      case 'completed':
        return '✓';
      case 'error':
        return '⚠';
      case 'active':
        return index + 1;
      default:
        return index + 1;
    }
  };

  const getStepStatusClass = (step: ProgressStep) => {
    const baseClass = 'progress-step';
    const statusClass = `progress-step--${step.status}`;
    const optionalClass = step.isOptional ? 'progress-step--optional' : '';
    return `${baseClass} ${statusClass} ${optionalClass}`.trim();
  };

  return (
    <div className={`progress-indicator progress-indicator--${variant} progress-indicator--${size} ${className}`}>
      {/* Progress bar for horizontal variant */}
      {variant === 'horizontal' && (
        <div className="progress-bar">
          <div 
            className="progress-bar__fill" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      {/* Steps */}
      <div className="progress-steps">
        {steps.map((step, index) => (
          <div key={step.id} className={getStepStatusClass(step)}>
            {/* Step connector line (for vertical variant) */}
            {variant === 'vertical' && index > 0 && (
              <div className="progress-step__connector" />
            )}

            {/* Step circle/icon */}
            <div className="progress-step__icon">
              <span className="progress-step__icon-content">
                {getStepIcon(step, index)}
              </span>
            </div>

            {/* Step content */}
            <div className="progress-step__content">
              <div className="progress-step__title">
                {step.title}
                {step.isOptional && (
                  <span className="progress-step__optional-badge">Optional</span>
                )}
              </div>
              
              {showDescriptions && step.description && (
                <div className="progress-step__description">
                  {step.description}
                </div>
              )}

              {/* Loading indicator for active step */}
              {step.status === 'active' && (
                <div className="progress-step__loading">
                  <div className="progress-step__spinner" />
                  <span className="progress-step__loading-text">In progress...</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Progress summary */}
      <div className="progress-summary">
        <div className="progress-summary__text">
          Step {currentStepIndex + 1} of {totalSteps}
        </div>
        <div className="progress-summary__percentage">
          {Math.round(progressPercentage)}% Complete
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;