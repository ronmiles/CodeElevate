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
  const [solution, setSolution] = useState<string>('');
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    const fetchExercise = async () => {
      if (!exerciseId || !token) return;

      try {
        setLoading(true);
        const data = await exercisesApi.getExercise(exerciseId, token);
        setExercise(data);
        // Initialize with initial code if available
        if (data.initialCode) {
          setSolution(data.initialCode);
        }
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setSolution(content);
    };
    reader.onerror = () => {
      setStatusMessage('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!exerciseId || !token || !solution.trim()) return;

    try {
      setSubmitStatus('loading');
      setStatusMessage('Submitting your solution...');

      // Update the progress with the code solution
      await exercisesApi.updateProgress(
        exerciseId,
        {
          status: 'IN_PROGRESS',
          code: solution,
        },
        token
      );

      setSubmitStatus('success');
      setStatusMessage('Solution submitted successfully');
    } catch (err) {
      setSubmitStatus('error');
      setStatusMessage(
        err instanceof Error ? err.message : 'Failed to submit solution'
      );
      console.error('Error submitting solution:', err);
    }
  };

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

        <div className="bg-secondary-background p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-text mb-4">
            Code Solution
          </h2>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-text-secondary">
                Upload Solution File:
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  accept=".js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.cs,.go,.rb"
                />
                <button className="px-3 py-1.5 bg-primary text-white rounded hover:bg-primary-dark text-sm">
                  Choose File
                </button>
              </div>
            </div>

            <textarea
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              className="w-full h-80 p-3 bg-background text-text font-mono text-sm rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder={`Enter your solution code here (${exercise.language.name})...`}
            />
          </div>

          <div className="flex items-center justify-between">
            <span
              className={`text-sm ${
                submitStatus === 'error'
                  ? 'text-error'
                  : submitStatus === 'success'
                  ? 'text-green-600'
                  : 'text-text-secondary'
              }`}
            >
              {statusMessage}
            </span>

            <button
              onClick={handleSubmit}
              disabled={submitStatus === 'loading' || !solution.trim()}
              className={`px-4 py-2 bg-primary text-white rounded-lg ${
                submitStatus === 'loading' || !solution.trim()
                  ? 'opacity-60 cursor-not-allowed'
                  : 'hover:bg-primary-dark'
              }`}
            >
              {submitStatus === 'loading' ? 'Submitting...' : 'Submit Solution'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExercisePage;
