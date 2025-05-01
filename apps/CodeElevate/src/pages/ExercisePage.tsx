import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { exercisesApi, Exercise } from '../api/exercises.api';
import { useAuth } from '../contexts/AuthContext';

export const ExercisePage: React.FC = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExercise = async () => {
      if (!exerciseId || !token) return;

      try {
        setLoading(true);
        const data = await exercisesApi.getExercise(exerciseId, token);
        setExercise(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load exercise'
        );
        console.error('Error loading exercise:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExercise();
  }, [exerciseId, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-text-secondary">Loading exercise...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-6xl py-10 px-4">
        <div className="flex flex-col items-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-error mb-2">
              Error Loading Exercise
            </h2>
            <p className="text-text-secondary mb-4">{error}</p>
            <button
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              onClick={() => navigate(-1)}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="container mx-auto max-w-6xl py-10 px-4">
        <div className="flex flex-col items-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-text mb-2">
              Exercise Not Found
            </h2>
            <button
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              onClick={() => navigate(-1)}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 bg-background">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold text-text mb-2">
            {exercise.title}
          </h1>
          <div className="flex gap-2 mb-4">
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              {exercise.language.name}
            </span>
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                exercise.difficulty === 'EASY'
                  ? 'bg-green-100 text-green-800'
                  : exercise.difficulty === 'MEDIUM'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {exercise.difficulty}
            </span>
          </div>
          <p className="text-text-secondary mb-6">{exercise.description}</p>
        </div>

        {exercise.hints && exercise.hints.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-text mb-2">Hints</h2>
            <div className="flex flex-col gap-2">
              {exercise.hints.map((hint, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-secondary-background rounded-lg"
                >
                  <p className="text-text-secondary">{hint}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add code editor, submissions, and other exercise-specific UI here */}
        <div className="bg-secondary-background p-6 rounded-lg min-h-[400px]">
          <h2 className="text-xl font-semibold text-text mb-4">Code Editor</h2>
          <p className="text-text-secondary">
            Code editor and submission UI will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExercisePage;
