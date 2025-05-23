import React from 'react';

interface GradeDisplayProps {
  grade: number;
}

const GradeDisplay: React.FC<GradeDisplayProps> = ({ grade }) => {
  // Determine color based on grade
  const getGradeColor = () => {
    if (grade >= 90) return 'bg-green-500';
    if (grade >= 70) return 'bg-blue-500';
    if (grade >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Determine message based on grade
  const getGradeMessage = () => {
    if (grade >= 90) return 'Excellent!';
    if (grade >= 70) return 'Good job!';
    if (grade >= 50) return 'Satisfactory';
    return 'Needs improvement';
  };

  return (
    <div className="flex items-center p-4 bg-gray-800 rounded-lg border border-gray-700 mb-4">
      <div className="relative mr-6">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center ${getGradeColor()} text-white text-3xl font-bold`}
        >
          {grade}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-semibold text-white mb-1">Your Grade</h3>
        <p className="text-gray-300">{getGradeMessage()}</p>
        <p className="text-gray-400 text-sm mt-2">
          This grade is based on code quality, correctness, and best practices.
        </p>
      </div>
    </div>
  );
};

export default GradeDisplay;
