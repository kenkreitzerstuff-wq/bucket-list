import React, { useState } from 'react';
import { Recommendation } from '../types';
import './RecommendationDisplay.css';

interface RecommendationDisplayProps {
  recommendations: Recommendation[];
  onAccept: (recommendation: Recommendation) => void;
  onReject: (recommendation: Recommendation) => void;
  onModify: (recommendation: Recommendation, modifications: Partial<Recommendation>) => void;
  isLoading?: boolean;
}

interface RecommendationItemProps {
  recommendation: Recommendation;
  onAccept: (recommendation: Recommendation) => void;
  onReject: (recommendation: Recommendation) => void;
  onModify: (recommendation: Recommendation, modifications: Partial<Recommendation>) => void;
}

const RecommendationItem: React.FC<RecommendationItemProps> = ({
  recommendation,
  onAccept,
  onReject,
  onModify
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [modifiedTitle, setModifiedTitle] = useState(recommendation.title);
  const [modifiedDescription, setModifiedDescription] = useState(recommendation.description);

  const handleModifySubmit = () => {
    const modifications: Partial<Recommendation> = {};
    
    if (modifiedTitle !== recommendation.title) {
      modifications.title = modifiedTitle;
    }
    
    if (modifiedDescription !== recommendation.description) {
      modifications.description = modifiedDescription;
    }
    
    if (Object.keys(modifications).length > 0) {
      onModify(recommendation, modifications);
    }
    
    setIsModifying(false);
  };

  const handleModifyCancel = () => {
    setModifiedTitle(recommendation.title);
    setModifiedDescription(recommendation.description);
    setIsModifying(false);
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  };

  const getDifficultyIcon = (difficulty?: string): string => {
    switch (difficulty) {
      case 'easy': return '🟢';
      case 'moderate': return '🟡';
      case 'challenging': return '🔴';
      default: return '';
    }
  };

  return (
    <div className={`recommendation-item ${recommendation.type}`}>
      <div className="recommendation-header">
        <div className="recommendation-type-badge">
          {recommendation.type === 'destination' ? '📍' : '🎯'} {recommendation.type}
        </div>
        <div className={`confidence-badge ${getConfidenceColor(recommendation.confidence)}`}>
          {Math.round(recommendation.confidence * 100)}% match
        </div>
      </div>

      <div className="recommendation-content">
        {isModifying ? (
          <div className="modification-form">
            <input
              type="text"
              value={modifiedTitle}
              onChange={(e) => setModifiedTitle(e.target.value)}
              className="modify-title-input"
              placeholder="Recommendation title"
            />
            <textarea
              value={modifiedDescription}
              onChange={(e) => setModifiedDescription(e.target.value)}
              className="modify-description-input"
              placeholder="Recommendation description"
              rows={3}
            />
            <div className="modification-actions">
              <button onClick={handleModifySubmit} className="save-modifications">
                Save Changes
              </button>
              <button onClick={handleModifyCancel} className="cancel-modifications">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="recommendation-title">{recommendation.title}</h3>
            <p className="recommendation-description">{recommendation.description}</p>
          </>
        )}

        <div className="recommendation-metadata">
          {recommendation.metadata?.duration && (
            <span className="metadata-item">
              ⏱️ {recommendation.metadata.duration} days
            </span>
          )}
          {recommendation.metadata?.difficulty && (
            <span className="metadata-item">
              {getDifficultyIcon(recommendation.metadata.difficulty)} {recommendation.metadata.difficulty}
            </span>
          )}
          {recommendation.metadata?.season && (
            <span className="metadata-item">
              🗓️ {recommendation.metadata.season}
            </span>
          )}
        </div>

        <div className="recommendation-tags">
          {recommendation.relatedTo.map((tag: string, index: number) => (
            <span key={index} className="related-tag">
              {tag}
            </span>
          ))}
        </div>

        {isExpanded && (
          <div className="recommendation-details">
            <div className="reasoning-section">
              <h4>Why this recommendation?</h4>
              <p className="reasoning-text">{recommendation.reasoning}</p>
            </div>
          </div>
        )}
      </div>

      <div className="recommendation-actions">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="expand-button"
          aria-label={isExpanded ? 'Show less' : 'Show more'}
        >
          {isExpanded ? '▲ Less' : '▼ More'}
        </button>
        
        {!isModifying && (
          <>
            <button
              onClick={() => setIsModifying(true)}
              className="modify-button"
              aria-label="Modify recommendation"
            >
              ✏️ Modify
            </button>
            <button
              onClick={() => onReject(recommendation)}
              className="reject-button"
              aria-label="Reject recommendation"
            >
              ❌ Reject
            </button>
            <button
              onClick={() => onAccept(recommendation)}
              className="accept-button"
              aria-label="Accept recommendation"
            >
              ✅ Accept
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const RecommendationDisplay: React.FC<RecommendationDisplayProps> = ({
  recommendations,
  onAccept,
  onReject,
  onModify,
  isLoading = false
}) => {
  const [filter, setFilter] = useState<'all' | 'destination' | 'experience'>('all');
  const [sortBy, setSortBy] = useState<'confidence' | 'type' | 'title'>('confidence');

  const filteredRecommendations = recommendations.filter(rec => 
    filter === 'all' || rec.type === filter
  );

  const sortedRecommendations = [...filteredRecommendations].sort((a, b) => {
    switch (sortBy) {
      case 'confidence':
        return b.confidence - a.confidence;
      case 'type':
        return a.type.localeCompare(b.type);
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="recommendation-display loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Generating personalized recommendations...</p>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="recommendation-display empty">
        <div className="empty-state">
          <h3>No recommendations yet</h3>
          <p>Complete your travel preferences to get personalized suggestions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendation-display">
      <div className="recommendations-header">
        <h2>Your Personalized Travel Recommendations</h2>
        <p className="recommendations-subtitle">
          Based on your preferences and Ken & Gail's bucket list experiences
        </p>
        
        <div className="recommendations-controls">
          <div className="filter-controls">
            <label htmlFor="filter-select">Filter by:</label>
            <select
              id="filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'destination' | 'experience')}
              className="filter-select"
            >
              <option value="all">All Recommendations</option>
              <option value="destination">Destinations Only</option>
              <option value="experience">Experiences Only</option>
            </select>
          </div>
          
          <div className="sort-controls">
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'confidence' | 'type' | 'title')}
              className="sort-select"
            >
              <option value="confidence">Best Match</option>
              <option value="type">Type</option>
              <option value="title">Name</option>
            </select>
          </div>
        </div>
      </div>

      <div className="recommendations-stats">
        <div className="stat-item">
          <span className="stat-number">{recommendations.length}</span>
          <span className="stat-label">Total Recommendations</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {recommendations.filter(r => r.type === 'destination').length}
          </span>
          <span className="stat-label">Destinations</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {recommendations.filter(r => r.type === 'experience').length}
          </span>
          <span className="stat-label">Experiences</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {recommendations.filter(r => r.confidence >= 0.8).length}
          </span>
          <span className="stat-label">High Confidence</span>
        </div>
      </div>

      <div className="recommendations-list">
        {sortedRecommendations.map((recommendation, index) => (
          <RecommendationItem
            key={`${recommendation.title}-${index}`}
            recommendation={recommendation}
            onAccept={onAccept}
            onReject={onReject}
            onModify={onModify}
          />
        ))}
      </div>

      {sortedRecommendations.length === 0 && filter !== 'all' && (
        <div className="no-filtered-results">
          <p>No {filter} recommendations found. Try changing the filter.</p>
        </div>
      )}
    </div>
  );
};

export default RecommendationDisplay;