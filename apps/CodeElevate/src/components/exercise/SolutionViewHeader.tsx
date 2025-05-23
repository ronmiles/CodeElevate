import React from 'react';
import { MessageSquare, Code, CheckCircle } from 'lucide-react';

interface SolutionViewHeaderProps {
  showSolution: boolean;
  showReview: boolean;
  children: React.ReactNode;
}

const SolutionViewHeader: React.FC<SolutionViewHeaderProps> = ({
  showSolution,
  showReview,
  children,
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold text-text flex items-center">
        {showSolution ? (
          <>
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            Example Solution
          </>
        ) : showReview ? (
          <>
            <MessageSquare className="h-5 w-5 mr-2 text-purple-500" />
            AI Code Review
          </>
        ) : (
          <>
            <Code className="h-5 w-5 mr-2 text-blue-500" />
            Your Solution
          </>
        )}
      </h2>
      <div className="flex gap-3">{children}</div>
    </div>
  );
};

export default SolutionViewHeader;
