import React from 'react';
import {
  Lightbulb,
  EyeOff,
  Eye,
  Code,
  CheckCircle,
  FileCode,
  Loader,
  MessageSquare,
} from 'lucide-react';

interface SolutionActionsProps {
  showSolution: boolean;
  showReview: boolean;
  showHints: boolean;
  solution: string;
  submitStatus: 'idle' | 'loading' | 'success' | 'error';
  reviewLoading: boolean;
  onSolutionRequest: () => void;
  onHintsToggle: () => void;
  onHideSolution: () => void;
  onReviewBack: () => void;
  onSubmit: () => void;
  onCodeReview: () => void;
}

const SolutionActions: React.FC<SolutionActionsProps> = ({
  showSolution,
  showReview,
  showHints,
  solution,
  submitStatus,
  reviewLoading,
  onSolutionRequest,
  onHintsToggle,
  onHideSolution,
  onReviewBack,
  onSubmit,
  onCodeReview,
}) => {
  if (showSolution) {
    return (
      <button
        onClick={onHideSolution}
        className="px-4 py-2 bg-gray-700 text-text rounded-lg hover:bg-gray-600 text-sm flex items-center shadow-sm transition-all duration-200"
      >
        <EyeOff className="h-4 w-4 mr-1" />
        Hide Solution
      </button>
    );
  }

  if (showReview) {
    return (
      <div className="flex gap-3">
        <button
          onClick={onReviewBack}
          className="px-4 py-2 bg-gray-700 text-text rounded-lg hover:bg-gray-600 text-sm flex items-center shadow-sm transition-all duration-200"
        >
          <Code className="h-4 w-4 mr-1" />
          Back to Editor
        </button>
        <button
          onClick={onSubmit}
          disabled={
            submitStatus === 'loading' || reviewLoading || !solution.trim()
          }
          className={`px-4 py-2 bg-primary text-white rounded-lg shadow-sm ${
            submitStatus === 'loading' || reviewLoading || !solution.trim()
              ? 'opacity-60 cursor-not-allowed'
              : 'hover:bg-primary-dark hover:shadow transition-all duration-200'
          } flex items-center`}
        >
          {submitStatus === 'loading' ? (
            <>
              <Loader className="animate-spin h-4 w-4 mr-1" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-1" />
              Submit Solution
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={onSolutionRequest}
        className="px-4 py-2 bg-indigo-900 text-indigo-100 rounded-lg hover:bg-indigo-800 text-sm flex items-center shadow-sm transition-all duration-200"
      >
        <Eye className="h-4 w-4 mr-1" />
        View Example Solution
      </button>
      <button
        onClick={onHintsToggle}
        className={`px-4 py-2 bg-yellow-900 text-yellow-100 rounded-lg text-sm flex items-center shadow-sm transition-all duration-200 ${
          showHints ? 'hover:bg-yellow-800' : 'hover:bg-yellow-800'
        }`}
      >
        {showHints ? (
          <>
            <EyeOff className="h-4 w-4 mr-1" />
            Hide Hints
          </>
        ) : (
          <>
            <Lightbulb className="h-4 w-4 mr-1" />
            Show Hints
          </>
        )}
      </button>
    </>
  );
};

export const ReviewButton: React.FC<{
  onCodeReview: () => void;
  disabled: boolean;
  reviewLoading: boolean;
}> = ({ onCodeReview, disabled, reviewLoading }) => {
  return (
    <button
      onClick={onCodeReview}
      disabled={disabled || reviewLoading}
      className={`px-4 py-2 bg-purple-900 text-purple-100 rounded-lg text-sm flex items-center shadow-sm transition-all duration-200 ${
        disabled || reviewLoading
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:bg-purple-800'
      }`}
    >
      {reviewLoading ? (
        <Loader className="animate-spin h-4 w-4 mr-1" />
      ) : (
        <MessageSquare className="h-4 w-4 mr-1" />
      )}
      Get AI Review
    </button>
  );
};

export default SolutionActions;
