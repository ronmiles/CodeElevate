import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { exercisesApi, Exercise } from '../api/exercises.api';
import { useAuth } from './AuthContext';

interface ExerciseContextType {
  selectedExercise: Exercise | null;
  isModalOpen: boolean;
  isLoading: boolean;
  error: string | null;
  openExercise: (exerciseId: string) => void;
  closeExercise: () => void;
}

const ExerciseContext = createContext<ExerciseContextType | undefined>(
  undefined
);

export const ExerciseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ exerciseId?: string }>();

  // Check if we're on an exercise route and load the exercise
  // Only load into modal if not on the ExercisePage
  useEffect(() => {
    // Skip this effect if we're on the dedicated ExercisePage (let the page component handle it)
    if (location.pathname.startsWith('/exercise/')) {
      console.log('Skipping modal load on ExercisePage');
      return;
    }

    if (params.exerciseId && token) {
      fetchExercise(params.exerciseId);
    }
  }, [params.exerciseId, token, location]);

  const fetchExercise = async (exerciseId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const exercise = await exercisesApi.getExercise(exerciseId, token!);
      setSelectedExercise(exercise);
      setIsModalOpen(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load exercise details'
      );
      console.error('Error loading exercise:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openExercise = useCallback(
    (exerciseId: string) => {
      // Navigate to the dedicated exercise page
      navigate(`/exercise/${exerciseId}`, { replace: true });
    },
    [navigate]
  );

  const closeExercise = useCallback(() => {
    setIsModalOpen(false);
    setSelectedExercise(null);

    // Only navigate back if we're NOT on the dedicated ExercisePage
    if (!location.pathname.startsWith('/exercise/')) {
      navigate(-1);
    }
  }, [navigate, location]);

  const value = {
    selectedExercise,
    isModalOpen,
    isLoading,
    error,
    openExercise,
    closeExercise,
  };

  return (
    <ExerciseContext.Provider value={value}>
      {children}
    </ExerciseContext.Provider>
  );
};

export const useExercise = () => {
  const context = useContext(ExerciseContext);
  if (context === undefined) {
    throw new Error('useExercise must be used within an ExerciseProvider');
  }
  return context;
};
