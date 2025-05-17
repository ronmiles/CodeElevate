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
              {totalCounts.strength}
            </div>
            <div className="text-sm text-gray-400">Strengths</div>
          </div>
          <div className="flex flex-col items-center bg-gray-900 p-3 rounded-lg border border-gray-700">
            <div className="text-2xl font-bold text-blue-500 mb-1">
              {totalCounts.improvement}
            </div>
            <div className="text-sm text-gray-400">Improvements</div>
          </div>
          <div className="flex flex-col items-center bg-gray-900 p-3 rounded-lg border border-gray-700">
            <div className="text-2xl font-bold text-red-500 mb-1">
              {totalCounts.issue}
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
          <p className="text-gray-300 mb-4">{summary.improvements}</p>

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
          <p className="text-gray-300">{summary.overallAssessment}</p>
        </div>

        {/* Logic Blocks Section */}
        {logicBlocks.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-semibold text-indigo-500 mb-3 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z"
                  clipRule="evenodd"
                />
              </svg>
              Logical Structure Analysis
            </h4>

            <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700 mb-4">
              <p className="text-sm text-gray-300">
                This analysis identifies logical code blocks that work together
                to achieve specific functionality. Each block represents a group
                of related lines that form a functional unit in your code.
              </p>
            </div>

            <div className="space-y-3">
              {logicBlocks.map((block, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-l-4 ${
                    block.type === 'strength'
                      ? 'bg-green-900/20 border-l-green-500 border-green-700/30'
                      : block.type === 'improvement'
                      ? 'bg-blue-900/20 border-l-blue-500 border-blue-700/30'
                      : 'bg-red-900/20 border-l-red-500 border-red-700/30'
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h5
                      className={`font-medium text-lg ${
                        block.type === 'strength'
                          ? 'text-green-400'
                          : block.type === 'improvement'
                          ? 'text-blue-400'
                          : 'text-red-400'
                      }`}
                    >
                      {block.description}
                    </h5>
                    <div className="flex items-center gap-2">
                      {block.severity === 'high' && (
                        <span className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded-md font-medium">
                          High Priority
                        </span>
                      )}
                      {block.severity === 'medium' && (
                        <span className="text-xs bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded-md font-medium">
                          Medium Priority
                        </span>
                      )}
                      <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-md text-gray-300">
                        Lines {block.lineRange[0]}-{block.lineRange[1]}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-300">{block.feedback}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Specific issues section */}
        {specificIssues.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-semibold text-amber-500 mb-3 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a.75.75 0 01.75.75v7.5a.75.75 0 01-1.5 0v-7.5A.75.75 0 0110 2zM10 15a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              Specific Line Issues
            </h4>

            <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700 mb-4">
              <p className="text-sm text-gray-300">
                These are specific issues identified on individual lines that
                may need attention.
              </p>
            </div>

            <div className="space-y-2">
              {specificIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    issue.type === 'praise'
                      ? 'bg-green-900/10 border border-green-700/30'
                      : issue.type === 'suggestion'
                      ? 'bg-blue-900/10 border border-blue-700/30'
                      : 'bg-red-900/10 border border-red-700/30'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="mt-0.5 mr-2">
                      {issue.type === 'praise' ? (
                        <svg
                          className="h-4 w-4 text-green-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : issue.type === 'suggestion' ? (
                        <svg
                          className="h-4 w-4 text-blue-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                        </svg>
                      ) : (
                        <svg
                          className={`h-4 w-4 text-red-400 ${
                            issue.severity === 'high' ? 'drop-shadow' : ''
                          }`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              issue.type === 'praise'
                                ? 'text-green-400'
                                : issue.type === 'suggestion'
                                ? 'text-blue-400'
                                : 'text-red-400'
                            }`}
                          >
                            {issue.type === 'praise'
                              ? 'Praise'
                              : issue.type === 'suggestion'
                              ? 'Suggestion'
                              : issue.severity === 'high'
                              ? 'Critical Error'
                              : 'Error'}
                          </span>
                          {issue.severity === 'high' &&
                            issue.type !== 'praise' && (
                              <span className="text-xs bg-red-900/40 text-red-300 px-1.5 py-0.5 rounded">
                                High
                              </span>
                            )}
                        </div>
                        <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-md text-gray-300">
                          Line {issue.line}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mt-1">
                        {issue.comment}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSummary;
