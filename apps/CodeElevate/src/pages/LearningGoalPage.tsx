import {
  Alert,
  Button,
  CircularProgress,
  Snackbar,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Exercise, exercisesApi } from '../api/exercises.api';
import { goalsApi, LearningGoal } from '../api/goals.api';
import { Checkpoint } from '../api/roadmap.api';
import { ExerciseDetailsOverlay } from '../components/ExerciseDetailsModal';
import { Navbar } from '../components/layout/Navbar';
import { useAuth } from '../hooks/useAuth';
import { ExerciseProvider } from '../contexts/ExerciseContext';

// Add scrollbar styling at the top of the file
const scrollbarStyles = `
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: rgba(17, 24, 39, 0.1);
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(75, 85, 99, 0.5);
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(75, 85, 99, 0.7);
  }
`;

export const LearningGoalPage: React.FC = () => {
  const { goalId, checkpointId } = useParams<{
    goalId: string;
    checkpointId?: string;
  }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const queryClient = useQueryClient();
  const [selectedCheckpoint, setSelectedCheckpoint] =
    useState<Checkpoint | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );

  const {
    data: goal,
    isLoading: isLoadingGoal,
    error: goalError,
  } = useQuery<LearningGoal>({
    queryKey: ['goal', goalId],
    queryFn: async () => {
      console.log('Executing goal query');
      if (!goalId || !token) {
        console.error('Missing required parameters:', { goalId, token });
        throw new Error('Missing goalId or token');
      }

      try {
        console.log('Making API request for goal:', goalId);
        const data = await goalsApi.getGoal(goalId, token);
        if (!data) {
          throw new Error('Goal not found');
        }
        console.log('Received goal data:', data);
        return data;
      } catch (error) {
        console.error('API request failed:', error);
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          throw new Error(
            `Goal with ID ${goalId} not found. Please check if the goal exists.`
          );
        }
        throw error;
      }
    },
    enabled: !!goalId && !!token,
    retry: false,
  });

  useEffect(() => {
    if (goal && checkpointId) {
      const found = goal.roadmap?.checkpoints.find(
        (cp) => cp.id === checkpointId
      );

      if (found) {
        setSelectedCheckpoint({
          ...found,
          createdAt: (found as any).createdAt || new Date().toISOString(),
          updatedAt: (found as any).updatedAt || new Date().toISOString(),
        } as Checkpoint);
      }
    }
  }, [goal, checkpointId]);

  useEffect(() => {
    if (goal && !checkpointId && goal.roadmap?.checkpoints.length) {
      navigate(
        `/goal/${goal.id}/checkpoint/${goal.roadmap.checkpoints[0].id}`,
        { replace: true }
      );
    }
  }, [goal, checkpointId, navigate]);

  const { data: exercises, isLoading: isLoadingExercises } = useQuery({
    queryKey: ['exercises', selectedCheckpoint?.id],
    queryFn: async () => {
      try {
        const result = await exercisesApi.getCheckpointExercises(
          selectedCheckpoint!.id,
          token!
        );
        return result || [];
      } catch (error) {
        console.error('Error fetching checkpoint exercises:', error);
        setToast({
          open: true,
          message: 'Error loading exercises. Please try again.',
          severity: 'error',
        });
        return [];
      }
    },
    enabled: !!selectedCheckpoint && !!token,
  });

  const generateExerciseMutation = useMutation({
    mutationFn: () =>
      exercisesApi.generateExercise(
        goalId!,
        goal!.preferredLanguage.id,
        selectedCheckpoint!.id,
        token!
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['exercises', selectedCheckpoint?.id],
      });
      setToast({
        open: true,
        message: 'New exercise has been created for this checkpoint',
        severity: 'success',
      });
    },
    onError: (error: Error) => {
      setToast({
        open: true,
        message: error.message,
        severity: 'error',
      });
    },
  });

  const handleCheckpointClick = async (checkpoint: {
    id: string;
    title: string;
    description: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    order: number;
  }) => {
    try {
      const fullCheckpoint: Checkpoint = {
        ...checkpoint,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSelectedCheckpoint(fullCheckpoint);
      navigate(`/goal/${goalId}/checkpoint/${checkpoint.id}`);
      const existingExercises = await exercisesApi.getCheckpointExercises(
        checkpoint.id,
        token!
      );
      if (!existingExercises?.length) {
        generateExerciseMutation.mutate();
      }
    } catch (error) {
      setToast({
        open: true,
        message: 'Error loading exercises. Please try again.',
        severity: 'error',
      });
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoadingGoal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <CircularProgress className="text-primary" />
          <Typography className="mt-4 text-text-secondary">
            Loading goal details...
          </Typography>
        </div>
      </div>
    );
  }

  if (goalError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Typography className="text-error mb-4">
            {goalError instanceof Error ? goalError.message : 'Unknown error'}
          </Typography>
          <Button
            variant="contained"
            className="bg-primary hover:bg-primary-dark"
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Typography className="text-text-secondary mb-4">
            Goal not found
          </Typography>
          <Button
            variant="contained"
            className="bg-primary hover:bg-primary-dark"
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <div
            className="w-64 bg-secondary-background rounded-lg m-3 mr-0 flex-shrink-0 flex flex-col"
            style={{
              height: 'calc(100vh - 64px)',
            }}
          >
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-text">Learning Path</h2>
            </div>

            <div
              className="flex-1 p-4 pt-2 overflow-y-auto"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(75, 85, 99, 0.5) rgba(17, 24, 39, 0.1)',
              }}
            >
              <div className="space-y-2">
                {goal?.roadmap?.checkpoints.map((checkpoint) => (
                  <motion.div
                    key={checkpoint.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCheckpointClick(checkpoint)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                      selectedCheckpoint?.id === checkpoint.id
                        ? 'bg-primary text-white'
                        : 'hover:bg-background text-text-secondary hover:text-text'
                    }`}
                  >
                    <div className="font-medium">{checkpoint.title}</div>
                    <div className="text-sm opacity-80 truncate">
                      {checkpoint.description}
                    </div>
                    <div className="mt-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          checkpoint.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : checkpoint.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {checkpoint.status.replace('_', ' ')}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="flex-1 p-6 m-3 ml-3 rounded-lg overflow-y-auto"
            style={{
              height: 'calc(100vh - 64px)',
            }}
          >
            {selectedCheckpoint ? (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-text mb-4">
                    {selectedCheckpoint.title}
                  </h1>
                  <p className="text-text-secondary">
                    {selectedCheckpoint.description}
                  </p>
                </div>

                <div className="relative">
                  <h2 className="text-xl font-semibold text-text mb-4">
                    Exercises
                  </h2>

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

                  <div
                    ref={containerRef}
                    className="overflow-x-auto flex space-x-4 pb-4 px-8 scrollbar-hide"
                  >
                    {isLoadingExercises ? (
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
                          onClick={() => generateExerciseMutation.mutate()}
                          disabled={generateExerciseMutation.isPending}
                        >
                          {generateExerciseMutation.isPending ? (
                            <>
                              <CircularProgress size={20} className="mr-2" />{' '}
                              Generating...
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
                            onClick={() => {
                              navigate(`/exercise/${exercise.id}`);
                            }}
                          >
                            <h3 className="font-semibold text-text mb-2">
                              {exercise.title}
                            </h3>
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
                        ))}

                        <motion.div
                          whileHover={{
                            scale: generateExerciseMutation.isPending
                              ? 1
                              : 1.02,
                          }}
                          whileTap={{
                            scale: generateExerciseMutation.isPending
                              ? 1
                              : 0.98,
                          }}
                          className={`flex-shrink-0 w-72 bg-secondary-background rounded-lg p-4 ${
                            generateExerciseMutation.isPending
                              ? 'opacity-70 cursor-default'
                              : 'cursor-pointer border-primary hover:border-primary-hover'
                          } border-2 border-dashed`}
                          onClick={() =>
                            !generateExerciseMutation.isPending &&
                            generateExerciseMutation.mutate()
                          }
                          style={{
                            pointerEvents: generateExerciseMutation.isPending
                              ? 'none'
                              : 'auto',
                          }}
                        >
                          <div className="h-full flex flex-col items-center justify-center text-center p-4">
                            <div className="w-12 h-12 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mb-4">
                              {generateExerciseMutation.isPending ? (
                                <CircularProgress
                                  size={24}
                                  className="text-primary"
                                />
                              ) : (
                                <svg
                                  className="w-6 h-6 text-primary"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                  />
                                </svg>
                              )}
                            </div>
                            <h3 className="font-semibold text-text mb-2">
                              Generate More
                            </h3>
                            <p className="text-sm text-text-secondary">
                              {generateExerciseMutation.isPending
                                ? 'Creating new exercise...'
                                : 'Create a new exercise for this checkpoint'}
                            </p>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-text-secondary">
                Select a checkpoint from the sidebar to view its exercises
              </div>
            )}
          </div>
        </div>

        <ExerciseProvider>
          <ExerciseDetailsOverlay
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            exercise={selectedExercise}
          />
        </ExerciseProvider>

        <Snackbar
          open={toast.open}
          autoHideDuration={3000}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        >
          <Alert
            severity={toast.severity}
            onClose={() => setToast((prev) => ({ ...prev, open: false }))}
            className={`${
              toast.severity === 'success' ? 'bg-success' : 'bg-error'
            } text-white`}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      </div>
    </>
  );
};
