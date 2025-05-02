import React from 'react';
import { CodeReviewSummary } from '../../api/exercises.api';

interface ReviewSummaryProps {
  summary: CodeReviewSummary;
}

export const ReviewSummary: React.FC<ReviewSummaryProps> = ({ summary }) => {
  // Get the stats from the summary
  const stats = summary.counts;

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 mt-6">
      <div className="bg-gray-900 p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 text-purple-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path
              fillRule="evenodd"
              d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
              clipRule="evenodd"
            />
          </svg>
          Review Summary
        </h3>
      </div>

      <div className="p-4">
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="flex flex-col items-center bg-gray-900 p-3 rounded-lg border border-gray-700">
            <div className="text-2xl font-bold text-green-500 mb-1">
              {stats.praise}
            </div>
            <div className="text-sm text-gray-400">Praises</div>
          </div>
          <div className="flex flex-col items-center bg-gray-900 p-3 rounded-lg border border-gray-700">
            <div className="text-2xl font-bold text-blue-500 mb-1">
              {stats.suggestion}
            </div>
            <div className="text-sm text-gray-400">Suggestions</div>
          </div>
          <div className="flex flex-col items-center bg-gray-900 p-3 rounded-lg border border-gray-700">
            <div className="text-2xl font-bold text-red-500 mb-1">
              {stats.issue}
            </div>
            <div className="text-sm text-gray-400">Issues</div>
          </div>
        </div>

        {/* Summary */}
        <div>
          <h4 className="text-md font-semibold text-green-500 mb-2 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Strengths
          </h4>
          <p className="text-gray-300 mb-4">{summary.strengths}</p>

          <h4 className="text-md font-semibold text-blue-500 mb-2 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Areas for Improvement
          </h4>
          <p className="text-gray-300">{summary.improvements}</p>
        </div>
      </div>
    </div>
  );
};

export default ReviewSummary;
