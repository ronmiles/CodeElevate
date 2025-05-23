import React from 'react';

interface NavigationControlsProps {
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  canProceed: boolean;
  isLoading: boolean;
  onBack: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  isFirstQuestion,
  isLastQuestion,
  canProceed,
  isLoading,
  onBack,
  onPrevious,
  onNext,
}) => {
  return (
    <div className="p-6 border-t border-border">
      <div className="flex justify-between items-center max-w-2xl mx-auto">
        <div className="flex space-x-3">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text hover:bg-background rounded-lg transition-all duration-200"
          >
            ← Back to Goal
          </button>

          {!isFirstQuestion && (
            <button
              onClick={onPrevious}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text hover:bg-background rounded-lg transition-all duration-200"
            >
              Previous
            </button>
          )}
        </div>

        <button
          onClick={onNext}
          disabled={!canProceed || isLoading}
          className="px-6 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading
            ? 'Creating Goal...'
            : isLastQuestion
            ? 'Create Goal'
            : 'Next'}
        </button>
      </div>
    </div>
  );
};
