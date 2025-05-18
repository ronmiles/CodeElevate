import React, { useState } from 'react';
import { CodeReviewComment, CodeReviewSummary } from '../../api/exercises.api';
import CodeReviewEditor from './CodeReviewEditor';
import ReviewChatPanel from './ReviewChatPanel';
import { FiMessageSquare } from 'react-icons/fi';

interface CodeReviewProps {
  exerciseId: string;
  code: string;
  language: string;
  comments: CodeReviewComment[];
  summary?: CodeReviewSummary;
  isLoading?: boolean;
  error?: string;
}

export const CodeReview: React.FC<CodeReviewProps> = ({
  exerciseId,
  code,
  language,
  comments,
  summary,
  isLoading = false,
  error,
}) => {
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="relative h-full">
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-10">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="mt-3 text-sm text-white">
              Generating AI Review...
            </span>
          </div>
        </div>
      )}

      <CodeReviewEditor code={code} language={language} comments={comments} />

      {error && (
        <div className="mt-4 p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-sm">
          <div className="flex items-start">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-medium mb-1">Error Generating Review</p>
              <p>{error}</p>
              <p className="mt-2 text-red-300">
                Please try again or continue working on your solution.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && comments.length === 0 && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg text-gray-300 text-sm">
          No review comments yet. Submit your code for AI review.
        </div>
      )}

      {!isLoading && !error && comments.length > 0 && !showChat && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => setShowChat(true)}
            className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FiMessageSquare size={20} />
            <span>Ask about the review</span>
          </button>
        </div>
      )}

      {showChat && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[450px] shadow-xl">
          <ReviewChatPanel
            exerciseId={exerciseId}
            code={code}
            onClose={() => setShowChat(false)}
            reviewComments={comments}
          />
        </div>
      )}
    </div>
  );
};

export default CodeReview;
