import React, { useState, useEffect } from 'react';
import { TravelInputData } from '../types';
import { travelInputApi } from '../services/travelInputApi';
import './FollowUpQuestions.css';

interface FollowUpQuestion {
  id: string;
  question: string;
  type: 'text' | 'multiple-choice' | 'range';
  options?: string[];
  context: string;
}

interface FollowUpQuestionsProps {
  travelInput: TravelInputData;
  onAnswersSubmit: (answers: { [questionId: string]: string | string[] }) => void;
  onSkip: () => void;
  isLoading?: boolean;
  className?: string;
}

interface QuestionState {
  questions: FollowUpQuestion[];
  answers: { [questionId: string]: string | string[] };
  currentQuestionIndex: number;
  isLoadingQuestions: boolean;
  error: string | null;
}

export const FollowUpQuestions: React.FC<FollowUpQuestionsProps> = ({
  travelInput,
  onAnswersSubmit,
  onSkip,
  isLoading = false,
  className = ''
}) => {
  const [state, setState] = useState<QuestionState>({
    questions: [],
    answers: {},
    currentQuestionIndex: 0,
    isLoadingQuestions: true,
    error: null
  });

  useEffect(() => {
    loadFollowUpQuestions();
  }, [travelInput]);

  const loadFollowUpQuestions = async () => {
    try {
      setState(prev => ({ ...prev, isLoadingQuestions: true, error: null }));
      
      const response = await travelInputApi.generateFollowUpQuestions(travelInput);
      
      setState(prev => ({
        ...prev,
        questions: response.questions,
        isLoadingQuestions: false,
        answers: {}
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load questions';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoadingQuestions: false
      }));
    }
  };

  const updateAnswer = (questionId: string, answer: string | string[]) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answer }
    }));
  };

  const nextQuestion = () => {
    if (state.currentQuestionIndex < state.questions.length - 1) {
      setState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }));
    }
  };

  const prevQuestion = () => {
    if (state.currentQuestionIndex > 0) {
      setState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1
      }));
    }
  };

  const handleSubmit = () => {
    onAnswersSubmit(state.answers);
  };

  const isCurrentQuestionAnswered = () => {
    const currentQuestion = state.questions[state.currentQuestionIndex];
    if (!currentQuestion) return false;
    
    const answer = state.answers[currentQuestion.id];
    return answer !== undefined && answer !== '' && 
           (Array.isArray(answer) ? answer.length > 0 : true);
  };

  const renderMultipleChoiceQuestion = (question: FollowUpQuestion) => {
    const currentAnswer = state.answers[question.id] as string[] || [];
    
    return (
      <div className="question-content">
        <div className="question-options">
          {question.options?.map((option, index) => (
            <label key={index} className="option-label">
              <input
                type="checkbox"
                checked={currentAnswer.includes(option)}
                onChange={(e) => {
                  const newAnswer = e.target.checked
                    ? [...currentAnswer, option]
                    : currentAnswer.filter(a => a !== option);
                  updateAnswer(question.id, newAnswer);
                }}
              />
              <span className="option-text">{option}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const renderTextQuestion = (question: FollowUpQuestion) => {
    const currentAnswer = state.answers[question.id] as string || '';
    
    return (
      <div className="question-content">
        <textarea
          value={currentAnswer}
          onChange={(e) => updateAnswer(question.id, e.target.value)}
          placeholder="Please provide more details..."
          className="text-answer"
          rows={4}
        />
      </div>
    );
  };

  const renderRangeQuestion = (question: FollowUpQuestion) => {
    const currentAnswer = state.answers[question.id] as string || '';
    
    return (
      <div className="question-content">
        <div className="range-options">
          {question.options?.map((option, index) => (
            <label key={index} className="range-option">
              <input
                type="radio"
                name={question.id}
                value={option}
                checked={currentAnswer === option}
                onChange={(e) => updateAnswer(question.id, e.target.value)}
              />
              <span className="range-text">{option}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const renderQuestion = (question: FollowUpQuestion) => {
    switch (question.type) {
      case 'multiple-choice':
        return renderMultipleChoiceQuestion(question);
      case 'text':
        return renderTextQuestion(question);
      case 'range':
        return renderRangeQuestion(question);
      default:
        return <div>Unsupported question type</div>;
    }
  };

  if (state.isLoadingQuestions) {
    return (
      <div className={`follow-up-questions loading ${className}`}>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Analyzing your input and generating follow-up questions...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className={`follow-up-questions error ${className}`}>
        <div className="error-container">
          <div className="error-icon">⚠</div>
          <div className="error-content">
            <h3>Unable to Load Questions</h3>
            <p>{state.error}</p>
            <div className="error-actions">
              <button onClick={loadFollowUpQuestions} className="retry-button">
                Try Again
              </button>
              <button onClick={onSkip} className="skip-button">
                Skip Questions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.questions.length === 0) {
    return (
      <div className={`follow-up-questions no-questions ${className}`}>
        <div className="no-questions-container">
          <div className="success-icon">✓</div>
          <h3>Great! Your input looks complete</h3>
          <p>We have enough information to generate personalized recommendations for you.</p>
          <button onClick={onSkip} className="continue-button">
            Continue to Recommendations
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = state.questions[state.currentQuestionIndex];
  const progress = ((state.currentQuestionIndex + 1) / state.questions.length) * 100;

  return (
    <div className={`follow-up-questions ${className}`}>
      <div className="questions-header">
        <h2>Help us understand better</h2>
        <p>We found some areas where we could use more specific information to give you better recommendations.</p>
        
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-text">
            Question {state.currentQuestionIndex + 1} of {state.questions.length}
          </div>
        </div>
      </div>

      <div className="question-container">
        <div className="question-header">
          <h3 className="question-title">{currentQuestion.question}</h3>
          <div className="question-context">
            <span className="context-label">Context:</span>
            <span className="context-text">{currentQuestion.context}</span>
          </div>
        </div>

        {renderQuestion(currentQuestion)}
      </div>

      <div className="questions-navigation">
        <button
          onClick={prevQuestion}
          disabled={state.currentQuestionIndex === 0}
          className="nav-button prev-button"
        >
          Previous
        </button>

        <div className="nav-center">
          <button
            onClick={onSkip}
            className="skip-all-button"
          >
            Skip All Questions
          </button>
        </div>

        {state.currentQuestionIndex < state.questions.length - 1 ? (
          <button
            onClick={nextQuestion}
            disabled={!isCurrentQuestionAnswered()}
            className="nav-button next-button"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="nav-button submit-button"
          >
            {isLoading ? (
              <>
                <div className="button-spinner"></div>
                Processing...
              </>
            ) : (
              'Complete'
            )}
          </button>
        )}
      </div>

      <div className="questions-summary">
        <h4>Answered Questions:</h4>
        <div className="answered-questions">
          {state.questions.map((question, index) => {
            const isAnswered = state.answers[question.id] !== undefined;
            const isCurrent = index === state.currentQuestionIndex;
            
            return (
              <div
                key={question.id}
                className={`question-indicator ${isAnswered ? 'answered' : ''} ${isCurrent ? 'current' : ''}`}
                onClick={() => setState(prev => ({ ...prev, currentQuestionIndex: index }))}
              >
                {index + 1}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};