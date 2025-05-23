import React from 'react';
import { Lightbulb } from 'lucide-react';

interface HintsProps {
  hints: string[];
}

const Hints: React.FC<HintsProps> = ({ hints }) => {
  if (!hints || hints.length === 0) return null;

  return (
    <div className="bg-secondary-background p-6 rounded-lg shadow-sm border border-gray-700">
      <h2 className="text-xl font-semibold text-text mb-4 flex items-center">
        <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
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
