import React from 'react';
import {
  CodeReviewSummary,
  LogicBlock,
  CodeReviewComment,
} from '../../api/exercises.api';

interface ReviewSummaryProps {
  summary: CodeReviewSummary;
  logicBlocks?: LogicBlock[];
  specificIssues?: CodeReviewComment[];
}

export const ReviewSummary: React.FC<ReviewSummaryProps> = ({
  summary,
  logicBlocks = [],
  specificIssues = [],
}) => {
  // Count by types from logic blocks
  const logicBlockCounts = {
    strength: logicBlocks.filter((block) => block.type === 'strength').length,
    improvement: logicBlocks.filter((block) => block.type === 'improvement')
      .length,
    issue: logicBlocks.filter((block) => block.type === 'critical').length,
  };

  // Count by types from specific issues
  const specificCounts = {
    strength: specificIssues.filter((issue) => issue.type === 'praise').length,
    improvement: specificIssues.filter((issue) => issue.type === 'suggestion')
      .length,
    issue: specificIssues.filter((issue) => issue.type === 'error').length,
  };

  // Combined counts
  const totalCounts = {
    strength: logicBlockCounts.strength + specificCounts.strength,
    improvement: logicBlockCounts.improvement + specificCounts.improvement,
    issue: logicBlockCounts.issue + specificCounts.issue,
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 mt-6 shadow-lg">
      <div className="bg-gray-900 p-4 border-b border-gray-700 flex items-center justify-between">
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

      <div className="p-6">
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="flex flex-col items-center bg-gray-900 p-4 rounded-lg border border-gray-700 hover:border-green-500 transition-all duration-200 shadow-sm">
            <div className="text-3xl font-bold text-green-500 mb-1">
              {totalCounts.strength}
            </div>
            <div className="text-sm text-gray-300">Strengths</div>
          </div>
          <div className="flex flex-col items-center bg-gray-900 p-4 rounded-lg border border-gray-700 hover:border-blue-500 transition-all duration-200 shadow-sm">
            <div className="text-3xl font-bold text-blue-500 mb-1">
              {totalCounts.improvement}
            </div>
            <div className="text-sm text-gray-300">Improvements</div>
          </div>
          <div className="flex flex-col items-center bg-gray-900 p-4 rounded-lg border border-gray-700 hover:border-red-500 transition-all duration-200 shadow-sm">
            <div className="text-3xl font-bold text-red-500 mb-1">
              {totalCounts.issue}
            </div>
            <div className="text-sm text-gray-300">Issues</div>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <div className="bg-gray-900 p-4 rounded-lg border-l-4 border-green-500">
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
            <p className="text-gray-300 leading-relaxed">{summary.strengths}</p>
          </div>

          <div className="bg-gray-900 p-4 rounded-lg border-l-4 border-blue-500">
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
            <p className="text-gray-300 leading-relaxed">
              {summary.improvements}
            </p>
          </div>

          <div className="bg-gray-900 p-4 rounded-lg border-l-4 border-purple-500">
            <h4 className="text-md font-semibold text-purple-500 mb-2 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                  clipRule="evenodd"
                />
              </svg>
              Overall Assessment
            </h4>
            <p className="text-gray-300 leading-relaxed">
              {summary.overallAssessment}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSummary;
