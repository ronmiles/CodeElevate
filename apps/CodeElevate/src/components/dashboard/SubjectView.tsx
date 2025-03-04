import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LearningGoal } from '../../api/goals.api';
import { exercisesApi, Exercise } from '../../api/exercises.api';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface SubjectViewProps {
  goal: LearningGoal;
}

export const SubjectView: React.FC<SubjectViewProps> = ({ goal }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { data: exercises, isLoading } = useQuery({
    queryKey: ['exercises', goal.id],
    queryFn: () => exercisesApi.getExercises(token!),
    enabled: !!token,
  });

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-4">{goal.title}</h1>
        <p className="text-text-secondary">{goal.description}</p>
      </div>

      <div className="relative">
        <h2 className="text-xl font-semibold text-text mb-4">Exercises</h2>
        
        {/* Scroll buttons */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-secondary-background rounded-full shadow-lg"
        >
          ←
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-secondary-background rounded-full shadow-lg"
        >
          →
        </button>

        {/* Exercise carousel */}
        <div
          ref={containerRef}
          className="overflow-x-auto flex space-x-4 pb-4 px-8 scrollbar-hide"
        >
          {isLoading ? (
            // Loading skeletons
            [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-72 h-48 bg-secondary-background rounded-lg animate-pulse"
              />
            ))
          ) : exercises?.length === 0 ? (
            <div className="text-text-secondary">No exercises available</div>
          ) : (
            exercises?.map((exercise: Exercise) => (
              <motion.div
                key={exercise.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-shrink-0 w-72 bg-secondary-background rounded-lg p-4 cursor-pointer"
                onClick={() => navigate(`/exercise/${exercise.id}`)}
              >
                <h3 className="font-semibold text-text mb-2">{exercise.title}</h3>
                <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                  {exercise.description}
                </p>
                <div className="flex space-x-2">
                  <span className="px-2 py-1 bg-background rounded text-xs text-text-secondary">
                    {exercise.difficulty}
                  </span>
                  <span className="px-2 py-1 bg-background rounded text-xs text-text-secondary">
                    {exercise.language.name}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}; 