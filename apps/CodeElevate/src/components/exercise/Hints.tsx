import React from 'react';

interface HintsProps {
  hints: string[];
}

const Hints: React.FC<HintsProps> = ({ hints }) => {
  if (!hints || hints.length === 0) return null;

  return (
    <div className="bg-secondary-background p-6 rounded-lg shadow-sm border border-gray-700">
      <h2 className="text-xl font-semibold text-text mb-4 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2 text-yellow-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        Hints
      </h2>
      <div className="flex flex-col gap-3">
        {hints.map((hint, idx) => (
          <div
            key={idx}
            className="p-4 bg-gray-800 rounded-lg shadow-sm border-l-4 border-yellow-600"
          >
            <p className="text-text-secondary">{hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Hints;
