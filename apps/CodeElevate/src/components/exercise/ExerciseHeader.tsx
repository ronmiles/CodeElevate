import React from 'react';
import { Exercise } from '../../api/exercises.api';

interface ExerciseHeaderProps {
  exercise: Exercise;
  position?: number;
  total?: number;
}

const ExerciseHeader: React.FC<ExerciseHeaderProps> = ({
  exercise,
  position,
  total,
}) => {
  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-lg shadow-sm border border-gray-700">
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold text-text mb-2">{exercise.title}</h1>
        {position !== undefined && total !== undefined && (
          <span className="text-text-secondary text-sm bg-gray-700 px-3 py-1 rounded-full">
            Exercise {position + 1} of {total}
          </span>
        )}
      </div>
      <div className="flex gap-2 mb-4">
        <span className="px-2 py-1 bg-purple-900 text-purple-100 text-xs font-medium rounded-full">
          {exercise.language.name}
        </span>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            exercise.difficulty === 'EASY'
              ? 'bg-green-900 text-green-100'
              : exercise.difficulty === 'MEDIUM'
              ? 'bg-yellow-900 text-yellow-100'
              : 'bg-red-900 text-red-100'
          }`}
        >
          {exercise.difficulty}
        </span>
      </div>
      <p className="text-text-secondary mb-2 leading-relaxed">
        {exercise.description}
      </p>
    </div>
  );
};

export default ExerciseHeader;
