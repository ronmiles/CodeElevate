import React from 'react';
import { ReviewButton } from './SolutionActions';

interface SolutionContainerProps {
  showSolution: boolean;
  showReview: boolean;
  children: React.ReactNode;
  statusMessage: string;
  submitStatus: 'idle' | 'loading' | 'success' | 'error';
  reviewLoading: boolean;
  solution: string;
  onCodeReview: () => void;
}

const SolutionContainer: React.FC<SolutionContainerProps> = ({
  showSolution,
  showReview,
  children,
  statusMessage,
  submitStatus,
  reviewLoading,
  solution,
  onCodeReview,
}) => {
  return (
    <div className="bg-secondary-background p-6 rounded-lg shadow-sm border border-gray-700">
      {children}

      <div className="flex items-center justify-between">
        <span
          className={`text-sm ${
            submitStatus === 'error'
              ? 'text-error'
              : submitStatus === 'success'
              ? 'text-green-400'
              : 'text-text-secondary'
          }`}
        >
          {statusMessage}
        </span>

        {!showSolution && !showReview && (
          <ReviewButton
            onCodeReview={onCodeReview}
            disabled={!solution.trim()}
            reviewLoading={reviewLoading}
          />
        )}
      </div>
    </div>
  );
};

export default SolutionContainer;
