import React from 'react';
import { motion } from 'framer-motion';
import { Exercise } from '../../api/exercises.api';
import { Button, CircularProgress } from '@mui/material';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ExercisesListProps {
  exercises: Exercise[] | undefined;
  isLoading: boolean;
  isPendingGeneration: boolean;
  onGenerateExercise: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onScroll: (direction: 'left' | 'right') => void;
}

export const ExercisesList: React.FC<ExercisesListProps> = ({
  exercises,
  isLoading,
  isPendingGeneration,
  onGenerateExercise,
  containerRef,
  onScroll,
}) => {
  const navigate = useNavigate();

  return (
    <div className="relative">
      <h2 className="text-xl font-semibold text-text mb-4">Exercises</h2>

      <button
        onClick={() => onScroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-secondary-background rounded-full shadow-lg"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={() => onScroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-secondary-background rounded-full shadow-lg"
      >
        <ChevronRight size={16} />
      </button>

      <div
        ref={containerRef}
        className="overflow-x-auto flex space-x-4 pb-4 px-8 scrollbar-hide"
      >
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-72 h-48 bg-secondary-background rounded-lg animate-pulse"
            />
          ))
        ) : exercises?.length === 0 ? (
          <div className="flex-shrink-0 w-full text-center">
            <div className="text-text-secondary mb-4">
              No exercises available for this checkpoint yet
            </div>
            <Button
              variant="contained"
              className="bg-primary hover:bg-primary-dark"
              onClick={onGenerateExercise}
              disabled={isPendingGeneration}
            >
              {isPendingGeneration ? (
                <>
                  <CircularProgress size={20} className="mr-2" /> Generating...
                </>
              ) : (
                'Generate Exercise'
              )}
            </Button>
          </div>
        ) : (
          <>
            {exercises?.map((exercise: Exercise) => (
              <motion.div
                key={exercise.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-shrink-0 w-72 bg-secondary-background rounded-lg p-4 cursor-pointer bg-green-50"
                onClick={() => navigate(`/exercise/${exercise.id}`)}
              >
                <h3 className="font-semibold text-text mb-2">
                  {exercise.title}
                </h3>
                <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                  {exercise.description}
                </p>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex space-x-2">
                    <span className="px-2 py-1 bg-background rounded text-xs text-text-secondary">
                      {exercise.difficulty}
                    </span>
                    <span className="px-2 py-1 bg-background rounded text-xs text-text-secondary">
                      {exercise.language.name}
                    </span>
                  </div>
                  {exercise.progress && exercise.progress[0]?.grade && (
                    <div
                      className={`px-2 py-1 rounded text-sm font-semibold ${
                        exercise.progress[0].grade >= 90
                          ? 'bg-green-100 text-green-800'
                          : exercise.progress[0].grade >= 70
                          ? 'bg-blue-100 text-blue-800'
                          : exercise.progress[0].grade >= 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {exercise.progress[0].grade}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            <motion.div
              whileHover={{
                scale: isPendingGeneration ? 1 : 1.02,
              }}
              whileTap={{
                scale: isPendingGeneration ? 1 : 0.98,
              }}
              className={`flex-shrink-0 w-72 bg-secondary-background rounded-lg p-4 ${
                isPendingGeneration
                  ? 'opacity-70 cursor-default'
                  : 'cursor-pointer border-primary hover:border-primary-hover'
              } border-2 border-dashed`}
              onClick={() => !isPendingGeneration && onGenerateExercise()}
              style={{
                pointerEvents: isPendingGeneration ? 'none' : 'auto',
              }}
            >
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mb-4">
                  {isPendingGeneration ? (
                    <CircularProgress size={24} className="text-primary" />
                  ) : (
                    <Plus className="w-6 h-6 text-primary" />
                  )}
                </div>
                <h3 className="font-semibold text-text mb-2">Generate More</h3>
                <p className="text-sm text-text-secondary">
                  {isPendingGeneration
                    ? 'Creating new exercise...'
                    : 'Create a new exercise for this checkpoint'}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExercisesList;
