import { useState, useEffect } from 'react';
import { HomeLocationSelector } from './components/HomeLocationSelector';
import { TravelInputForm } from './components/TravelInputForm';
import { FollowUpQuestions } from './components/FollowUpQuestions';
import { InputValidationFeedback } from './components/InputValidationFeedback';
import { ProgressIndicator, ProgressStep } from './components/ProgressIndicator';
import { PageLoadingIndicator, ApiLoadingIndicator } from './components/LoadingIndicator';
import RecommendationDisplay from './components/RecommendationDisplay';
import BucketListManager from './components/BucketListManager';
import { LocationData, TravelInputData, ValidationResult, UserProfile, Recommendation, BucketItem, CostEstimate } from './types';
import { locationApi } from './services/locationApi';
import { travelInputApi } from './services/travelInputApi';
import { RecommendationApi } from './services/recommendationApi';
import { BucketListApi } from './services/bucketListApi';
import './App.css';

type AppStep = 'home-location' | 'travel-input' | 'follow-up' | 'recommendations' | 'bucket-list' | 'complete';

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('home-location');
  const [homeLocation, setHomeLocation] = useState<LocationData | undefined>();
  const [travelInput, setTravelInput] = useState<TravelInputData | undefined>();
  const [completenessScore, setCompletenessScore] = useState<number>(0);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [bucketList, setBucketList] = useState<BucketItem[]>([]);
  const [costEstimates] = useState<{ [itemId: string]: CostEstimate }>({});
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  
  // Mock user ID for demo purposes
  const userId = 'demo-user-123';

  // Define progress steps
  const progressSteps: ProgressStep[] = [
    {
      id: 'home-location',
      title: 'Home Location',
      description: 'Set your departure point for travel calculations',
      status: homeLocation ? 'completed' : currentStep === 'home-location' ? 'active' : 'pending'
    },
    {
      id: 'travel-input',
      title: 'Travel Preferences',
      description: 'Share your travel dreams and preferences',
      status: travelInput ? 'completed' : currentStep === 'travel-input' ? 'active' : 'pending'
    },
    {
      id: 'follow-up',
      title: 'Clarification',
      description: 'Answer follow-up questions to refine recommendations',
      status: currentStep === 'recommendations' || currentStep === 'bucket-list' || currentStep === 'complete' ? 'completed' : currentStep === 'follow-up' ? 'active' : 'pending',
      isOptional: true
    },
    {
      id: 'recommendations',
      title: 'Recommendations',
      description: 'Review AI-generated travel suggestions',
      status: recommendations.length > 0 ? 'completed' : currentStep === 'recommendations' ? 'active' : 'pending'
    },
    {
      id: 'bucket-list',
      title: 'Bucket List',
      description: 'Manage your personalized travel bucket list',
      status: currentStep === 'bucket-list' || currentStep === 'complete' ? 'completed' : 'pending'
    },
    {
      id: 'complete',
      title: 'Complete',
      description: 'Your travel planning is ready!',
      status: currentStep === 'complete' ? 'completed' : 'pending'
    }
  ];

  useEffect(() => {
    loadUserData();
    loadBucketList();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      setProcessingMessage('Loading your travel planning session...');
      
      // Try to load existing home location
      try {
        const location = await locationApi.getHomeLocation(userId);
        setHomeLocation(location);
        
        // If we have home location, try to load travel input
        try {
          const travelData = await travelInputApi.getTravelInput(userId);
          setTravelInput(travelData.travelInput);
          setCompletenessScore(travelData.completenessScore);
          
          // Determine which step to show based on data completeness
          if (travelData.completenessScore >= 70) {
            // Check if we have recommendations
            if (recommendations.length > 0) {
              setCurrentStep('bucket-list');
            } else {
              setCurrentStep('recommendations');
            }
          } else if (travelData.incompleteAnalysis.needsFollowUp) {
            setCurrentStep('follow-up');
          } else {
            setCurrentStep('travel-input');
          }
        } catch {
          // No travel input found, go to travel input step
          setCurrentStep('travel-input');
        }
      } catch {
        // No home location found, start from beginning
        setCurrentStep('home-location');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setCurrentStep('home-location');
      setError('Failed to load your previous session. Starting fresh.');
    } finally {
      setIsLoading(false);
      setProcessingMessage('');
    }
  };

  const loadBucketList = () => {
    try {
      const savedBucketList = BucketListApi.loadBucketList();
      setBucketList(savedBucketList);
      
      // Load from shareable link if present
      const sharedBucketList = BucketListApi.loadFromShareableLink();
      if (sharedBucketList && sharedBucketList.length > 0) {
        setBucketList(prev => [...prev, ...sharedBucketList]);
        // Clear the URL parameter
        const url = new URL(window.location.href);
        url.searchParams.delete('shared');
        window.history.replaceState({}, document.title, url.toString());
      }
    } catch (error) {
      console.error('Error loading bucket list:', error);
    }
  };

  const handleLocationChange = async (location: LocationData) => {
    try {
      setError('');
      setIsProcessing(true);
      setProcessingMessage('Saving your home location...');
      
      await locationApi.setHomeLocation(userId, `${location.city}, ${location.country}`);
      setHomeLocation(location);
      setCurrentStep('travel-input');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save location';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const handleLocationValidationError = (error: string) => {
    setError(error);
  };

  const handleTravelInputSubmit = async (inputData: TravelInputData) => {
    try {
      setError('');
      setIsProcessing(true);
      setProcessingMessage('Analyzing your travel preferences...');
      
      // Store the travel input
      const response = await travelInputApi.storeTravelInput(userId, inputData);
      setTravelInput(response.storedInput);
      setCompletenessScore(response.completenessScore);
      
      setProcessingMessage('Checking if follow-up questions are needed...');
      
      // Check if we need follow-up questions
      const followUpResponse = await travelInputApi.generateFollowUpQuestions(inputData);
      
      if (followUpResponse.hasFollowUp) {
        setCurrentStep('follow-up');
      } else {
        // Generate recommendations directly
        setProcessingMessage('Generating personalized recommendations...');
        
        if (!homeLocation) {
          throw new Error('Home location is required for generating recommendations');
        }

        const userProfile: UserProfile = {
          id: userId,
          homeLocation,
          preferences: inputData.preferences || {},
          bucketList: []
        };

        const generatedRecommendations = await RecommendationApi.generateRecommendations(
          userProfile,
          inputData
        );
        
        setRecommendations(generatedRecommendations);
        setCurrentStep('recommendations');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save travel input';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const handleFollowUpAnswers = async (answers: { [questionId: string]: string | string[] }) => {
    try {
      setError('');
      setIsProcessing(true);
      setProcessingMessage('Processing your answers...');
      
      if (!travelInput || !homeLocation) {
        throw new Error('Missing required data for processing answers');
      }

      const userProfile: UserProfile = {
        id: userId,
        homeLocation,
        preferences: travelInput.preferences || {},
        bucketList: []
      };

      // Process follow-up answers and get updated recommendations
      const result = await RecommendationApi.integrateFollowUpAnswers(
        travelInput,
        answers,
        userProfile
      );
      
      setTravelInput(result.updatedInput);
      setRecommendations(result.recommendations);
      setCurrentStep('recommendations');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process answers';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const handleSkipFollowUp = async () => {
    try {
      setError('');
      setIsProcessing(true);
      setProcessingMessage('Generating recommendations...');
      
      if (!travelInput || !homeLocation) {
        throw new Error('Missing required data for generating recommendations');
      }

      const userProfile: UserProfile = {
        id: userId,
        homeLocation,
        preferences: travelInput.preferences || {},
        bucketList: []
      };

      // Generate recommendations without follow-up
      const generatedRecommendations = await RecommendationApi.generateRecommendations(
        userProfile,
        travelInput
      );
      
      setRecommendations(generatedRecommendations);
      setCurrentStep('recommendations');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate recommendations';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const handleValidationChange = (_newValidation: ValidationResult, score: number) => {
    // Store validation results for potential future use
    setCompletenessScore(score);
  };

  // Recommendation handlers
  const handleAcceptRecommendation = async (recommendation: Recommendation) => {
    try {
      const bucketItem: BucketItem = {
        id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        destination: recommendation.title,
        experiences: recommendation.relatedTo,
        estimatedDuration: recommendation.metadata?.duration || 7,
        costEstimate: {
          min: 1000,
          max: 3000,
          currency: 'USD'
        },
        priority: Math.ceil((1 - recommendation.confidence) * 5), // Higher confidence = lower priority number
        status: 'planned',
        notes: `Added from AI recommendation: ${recommendation.reasoning}`
      };

      const result = BucketListApi.addItem(bucketItem);
      if (result.success && result.data) {
        setBucketList(result.data);
      } else {
        setError(result.error?.message || 'Failed to add item to bucket list');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add recommendation';
      setError(errorMessage);
    }
  };

  const handleRejectRecommendation = (recommendation: Recommendation) => {
    setRecommendations(prev => prev.filter(r => r.title !== recommendation.title));
  };

  const handleModifyRecommendation = (recommendation: Recommendation, modifications: Partial<Recommendation>) => {
    setRecommendations(prev => prev.map(r => 
      r.title === recommendation.title ? { ...r, ...modifications } : r
    ));
  };

  const handleProceedToBucketList = () => {
    setCurrentStep('bucket-list');
  };

  const handleGenerateMoreRecommendations = async () => {
    try {
      setError('');
      setIsProcessing(true);
      setProcessingMessage('Generating more recommendations...');
      
      if (!travelInput || !homeLocation) {
        throw new Error('Missing required data for generating recommendations');
      }

      const userProfile: UserProfile = {
        id: userId,
        homeLocation,
        preferences: travelInput.preferences || {},
        bucketList
      };

      const newRecommendations = await RecommendationApi.generateRecommendations(
        userProfile,
        travelInput
      );
      
      // Merge with existing recommendations, avoiding duplicates
      setRecommendations(prev => {
        const existingTitles = new Set(prev.map(r => r.title));
        const uniqueNew = newRecommendations.filter(r => !existingTitles.has(r.title));
        return [...prev, ...uniqueNew];
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate more recommendations';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  // Bucket list handlers
  const handleAddToBucketList = (item: BucketItem) => {
    const result = BucketListApi.addItem(item);
    if (result.success && result.data) {
      setBucketList(result.data);
    } else {
      setError(result.error?.message || 'Failed to add item to bucket list');
    }
  };

  const handleRemoveFromBucketList = (itemId: string) => {
    const result = BucketListApi.removeItem(itemId);
    if (result.success && result.data) {
      setBucketList(result.data);
    } else {
      setError(result.error?.message || 'Failed to remove item from bucket list');
    }
  };

  const handleUpdateBucketListItem = (itemId: string, updates: Partial<BucketItem>) => {
    const result = BucketListApi.updateItem(itemId, updates);
    if (result.success && result.data) {
      setBucketList(result.data);
    } else {
      setError(result.error?.message || 'Failed to update bucket list item');
    }
  };

  const handleExportBucketList = (format: 'json' | 'csv') => {
    try {
      const success = format === 'json' 
        ? BucketListApi.exportAsJSON(bucketList)
        : BucketListApi.exportAsCSV(bucketList);
      
      if (!success) {
        setError(`Failed to export bucket list as ${format.toUpperCase()}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      setError(errorMessage);
    }
  };

  const handleShareBucketList = async () => {
    try {
      const success = await BucketListApi.copyShareableLink(bucketList);
      if (!success) {
        setError('Failed to copy shareable link');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create shareable link';
      setError(errorMessage);
    }
  };

  const resetToTravelInput = () => {
    setCurrentStep('travel-input');
    setTravelInput(undefined);
    setCompletenessScore(0);
  };

  const resetToHomeLocation = () => {
    setCurrentStep('home-location');
    setHomeLocation(undefined);
    setTravelInput(undefined);
    setCompletenessScore(0);
  };

  if (isLoading) {
    return (
      <PageLoadingIndicator message={processingMessage || 'Loading your travel planning session...'} />
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Travel Bucket List System</h1>
        <p>AI-powered travel planning and bucket list management</p>
        
        {/* Enhanced Progress indicator */}
        <ProgressIndicator
          steps={progressSteps}
          currentStepId={currentStep}
          showDescriptions={true}
          variant="horizontal"
          size="medium"
        />
      </header>
      
      <main>
        <div className="container">
          {/* Processing overlay */}
          {isProcessing && (
            <div className="processing-overlay">
              <ApiLoadingIndicator 
                operation={processingMessage || 'Processing'} 
                size="medium"
              />
            </div>
          )}

          {currentStep === 'home-location' && (
            <section className="home-location-section">
              <div className="section-header">
                <h2>Set Your Home Location</h2>
                <p>
                  Your home location is used to calculate travel costs and distances. 
                  You can enter it in various formats like "City, Country", airport codes, or postal codes.
                </p>
              </div>
              
              <HomeLocationSelector
                location={homeLocation}
                onLocationChange={handleLocationChange}
                onValidationError={handleLocationValidationError}
              />
            </section>
          )}

          {currentStep === 'travel-input' && (
            <section className="travel-input-section">
              <div className="section-header">
                <h2>Tell us about your travel dreams</h2>
                <p>
                  Share your travel preferences and we'll help you create the perfect bucket list.
                </p>
                {homeLocation && (
                  <div className="current-home-location">
                    <span className="location-label">Home:</span>
                    <span className="location-value">
                      {homeLocation.city}, {homeLocation.country}
                    </span>
                    <button onClick={resetToHomeLocation} className="change-location-btn">
                      Change
                    </button>
                  </div>
                )}
              </div>
              
              <TravelInputForm
                onSubmit={handleTravelInputSubmit}
                initialData={travelInput}
                isLoading={isProcessing}
              />
              
              {travelInput && (
                <InputValidationFeedback
                  travelInput={travelInput}
                  onValidationChange={handleValidationChange}
                />
              )}
            </section>
          )}

          {currentStep === 'follow-up' && travelInput && (
            <section className="follow-up-section">
              <div className="section-header">
                <h2>Let's refine your preferences</h2>
                <p>
                  Answer a few more questions to get more personalized recommendations.
                </p>
              </div>
              
              <FollowUpQuestions
                travelInput={travelInput}
                onAnswersSubmit={handleFollowUpAnswers}
                onSkip={handleSkipFollowUp}
                isLoading={isProcessing}
              />
            </section>
          )}

          {currentStep === 'recommendations' && (
            <section className="recommendations-section">
              <div className="section-header">
                <h2>Your Personalized Recommendations</h2>
                <p>
                  Based on your preferences, here are some AI-generated travel suggestions.
                  Accept the ones you like to add them to your bucket list.
                </p>
                {homeLocation && (
                  <div className="current-home-location">
                    <span className="location-label">Home:</span>
                    <span className="location-value">
                      {homeLocation.city}, {homeLocation.country}
                    </span>
                  </div>
                )}
              </div>
              
              <RecommendationDisplay
                recommendations={recommendations}
                onAccept={handleAcceptRecommendation}
                onReject={handleRejectRecommendation}
                onModify={handleModifyRecommendation}
                isLoading={isProcessing}
              />
              
              <div className="recommendations-actions">
                <button 
                  onClick={handleGenerateMoreRecommendations}
                  className="generate-more-button"
                  disabled={isProcessing}
                >
                  🔄 Generate More Recommendations
                </button>
                <button 
                  onClick={handleProceedToBucketList}
                  className="proceed-button"
                >
                  📝 View My Bucket List ({bucketList.length} items)
                </button>
              </div>
            </section>
          )}

          {currentStep === 'bucket-list' && (
            <section className="bucket-list-section">
              <div className="section-header">
                <h2>Your Travel Bucket List</h2>
                <p>
                  Manage your dream destinations and experiences. Add, edit, or remove items as your plans evolve.
                </p>
                {homeLocation && (
                  <div className="current-home-location">
                    <span className="location-label">Home:</span>
                    <span className="location-value">
                      {homeLocation.city}, {homeLocation.country}
                    </span>
                  </div>
                )}
              </div>
              
              <BucketListManager
                bucketList={bucketList}
                onAdd={handleAddToBucketList}
                onRemove={handleRemoveFromBucketList}
                onUpdate={handleUpdateBucketListItem}
                costEstimates={costEstimates}
              />
              
              <div className="bucket-list-actions">
                <button 
                  onClick={() => setCurrentStep('recommendations')}
                  className="back-to-recommendations-button"
                >
                  ← Back to Recommendations
                </button>
                <button 
                  onClick={() => handleExportBucketList('json')}
                  className="export-button"
                >
                  📥 Export as JSON
                </button>
                <button 
                  onClick={() => handleExportBucketList('csv')}
                  className="export-button"
                >
                  📊 Export as CSV
                </button>
                <button 
                  onClick={handleShareBucketList}
                  className="share-button"
                >
                  🔗 Share Bucket List
                </button>
                <button 
                  onClick={() => setCurrentStep('complete')}
                  className="complete-button"
                >
                  ✅ Complete Planning
                </button>
              </div>
            </section>
          )}

          {currentStep === 'complete' && (
            <section className="complete-section">
              <div className="completion-container">
                <div className="success-icon">🎉</div>
                <h2>Congratulations! Your travel planning is complete</h2>
                <p>
                  You've successfully created a personalized travel bucket list with AI-powered recommendations.
                </p>
                
                <div className="completion-stats">
                  <div className="stat-card">
                    <span className="stat-number">{bucketList.length}</span>
                    <span className="stat-label">Bucket List Items</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">{recommendations.length}</span>
                    <span className="stat-label">Recommendations Generated</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">
                      {bucketList.reduce((sum, item) => sum + item.estimatedDuration, 0)}
                    </span>
                    <span className="stat-label">Total Travel Days</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">
                      ${bucketList.reduce((sum, item) => sum + item.costEstimate.min, 0).toLocaleString()} - 
                      ${bucketList.reduce((sum, item) => sum + item.costEstimate.max, 0).toLocaleString()}
                    </span>
                    <span className="stat-label">Estimated Cost Range</span>
                  </div>
                </div>
                
                <div className="profile-summary">
                  <h3>Your Travel Profile</h3>
                  
                  {homeLocation && (
                    <div className="summary-item">
                      <strong>Home Location:</strong> 
                      <span>{homeLocation.city}, {homeLocation.country}</span>
                    </div>
                  )}
                  
                  {travelInput && (
                    <>
                      <div className="summary-item">
                        <strong>Destinations:</strong> 
                        <span>{travelInput.destinations.join(', ')}</span>
                      </div>
                      <div className="summary-item">
                        <strong>Experiences:</strong> 
                        <span>{travelInput.experiences.join(', ')}</span>
                      </div>
                      {travelInput.preferences && (
                        <>
                          <div className="summary-item">
                            <strong>Travel Style:</strong> 
                            <span>{travelInput.preferences.travelStyle}</span>
                          </div>
                          <div className="summary-item">
                            <strong>Group Size:</strong> 
                            <span>{travelInput.preferences.groupSize} people</span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                  
                  <div className="summary-item">
                    <strong>Profile Completeness:</strong> 
                    <span className="completeness-badge" style={{ 
                      backgroundColor: completenessScore >= 80 ? '#51cf66' : 
                                     completenessScore >= 60 ? '#ffd93d' : '#ff6b6b' 
                    }}>
                      {completenessScore}%
                    </span>
                  </div>
                </div>
                
                <div className="action-buttons">
                  <button onClick={() => setCurrentStep('bucket-list')} className="manage-bucket-list-button">
                    📝 Manage Bucket List
                  </button>
                  <button onClick={() => setCurrentStep('recommendations')} className="view-recommendations-button">
                    🤖 View Recommendations
                  </button>
                  <button onClick={() => handleExportBucketList('json')} className="export-button">
                    📥 Export Data
                  </button>
                  <button onClick={handleShareBucketList} className="share-button">
                    🔗 Share Your List
                  </button>
                  <button onClick={resetToTravelInput} className="edit-button">
                    ✏️ Edit Preferences
                  </button>
                  <button onClick={resetToHomeLocation} className="restart-button">
                    🔄 Start Over
                  </button>
                </div>
              </div>
            </section>
          )}
          
          {error && (
            <div className="global-error">
              <div className="error-content">
                <span className="error-icon">⚠</span>
                <span className="error-text">{error}</span>
                <button 
                  className="error-dismiss"
                  onClick={() => setError('')}
                  aria-label="Dismiss error"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;