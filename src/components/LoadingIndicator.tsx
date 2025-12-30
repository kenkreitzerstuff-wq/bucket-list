import React from 'react';
import './LoadingIndicator.css';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  overlay?: boolean;
  className?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Loading...',
  size = 'medium',
  variant = 'spinner',
  overlay = false,
  className = ''
}) => {
  const renderLoadingAnimation = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className={`loading-dots loading-dots--${size}`}>
            <div className="loading-dots__dot" />
            <div className="loading-dots__dot" />
            <div className="loading-dots__dot" />
          </div>
        );
      
      case 'pulse':
        return (
          <div className={`loading-pulse loading-pulse--${size}`}>
            <div className="loading-pulse__circle" />
          </div>
        );
      
      case 'skeleton':
        return (
          <div className={`loading-skeleton loading-skeleton--${size}`}>
            <div className="loading-skeleton__line loading-skeleton__line--long" />
            <div className="loading-skeleton__line loading-skeleton__line--medium" />
            <div className="loading-skeleton__line loading-skeleton__line--short" />
          </div>
        );
      
      case 'spinner':
      default:
        return (
          <div className={`loading-spinner loading-spinner--${size}`}>
            <div className="loading-spinner__circle" />
          </div>
        );
    }
  };

  const content = (
    <div className={`loading-indicator loading-indicator--${size} ${className}`}>
      {renderLoadingAnimation()}
      {message && (
        <div className="loading-indicator__message">
          {message}
        </div>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-overlay">
        <div className="loading-overlay__backdrop" />
        <div className="loading-overlay__content">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

// Specialized loading components for common use cases
export const ButtonLoadingIndicator: React.FC<{ size?: 'small' | 'medium' }> = ({ 
  size = 'small' 
}) => (
  <LoadingIndicator 
    variant="spinner" 
    size={size} 
    className="loading-indicator--inline"
  />
);

export const PageLoadingIndicator: React.FC<{ message?: string }> = ({ 
  message = 'Loading page...' 
}) => (
  <LoadingIndicator 
    variant="spinner" 
    size="large" 
    message={message}
    overlay={true}
    className="loading-indicator--page"
  />
);

export const ContentLoadingIndicator: React.FC<{ message?: string }> = ({ 
  message = 'Loading content...' 
}) => (
  <LoadingIndicator 
    variant="skeleton" 
    size="medium" 
    message={message}
    className="loading-indicator--content"
  />
);

export const ApiLoadingIndicator: React.FC<{ 
  operation?: string;
  size?: 'small' | 'medium' | 'large';
}> = ({ 
  operation = 'Processing',
  size = 'medium'
}) => (
  <LoadingIndicator 
    variant="dots" 
    size={size} 
    message={`${operation}...`}
    className="loading-indicator--api"
  />
);

export default LoadingIndicator;