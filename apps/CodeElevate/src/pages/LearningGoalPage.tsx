import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Stack,
  Typography,
  Chip,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  LinearProgress,
  Modal,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsApi, LearningGoal } from '../api/goals.api';
import { exercisesApi } from '../api/exercises.api';
import { useAuth } from '../hooks/useAuth';
import { Checkpoint } from '../api/roadmap.api';
import axios from 'axios';

export const LearningGoalPage = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const queryClient = useQueryClient();
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Add logging when component mounts
  useEffect(() => {
    console.log('LearningGoalPage mounted');
    console.log('URL Parameters:', { goalId });
    console.log('Auth Token:', token);
  }, [goalId, token]);

  const { data: goal, isLoading: isLoadingGoal, error: goalError } = useQuery<LearningGoal>({
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
          throw new Error(`Goal with ID ${goalId} not found. Please check if the goal exists.`);
        }
        throw error;
      }
    },
    enabled: !!goalId && !!token,
    retry: false, // Don't retry on 404
  });

  const { data: exercises, isLoading: isLoadingExercises } = useQuery({
    queryKey: ['checkpoint-exercises', selectedCheckpoint?.id],
    queryFn: () => exercisesApi.getCheckpointExercises(selectedCheckpoint!.id, token!),
    enabled: !!selectedCheckpoint && !!token,
  });

  const generateExerciseMutation = useMutation({
    mutationFn: () =>
      exercisesApi.generateExercise(goalId!, goal!.preferredLanguage.id, selectedCheckpoint!.id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkpoint-exercises', selectedCheckpoint?.id] });
      setToast({
        open: true,
        message: 'New exercise has been created for this checkpoint',
        severity: 'success'
      });
    },
    onError: (error: Error) => {
      setToast({
        open: true,
        message: error.message,
        severity: 'error'
      });
    },
  });

  const updateCheckpointStatusMutation = useMutation({
    mutationFn: ({ checkpointId, status }: { checkpointId: string; status: string }) =>
      goalsApi.updateCheckpointStatus(checkpointId, status, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
      setToast({
        open: true,
        message: 'Checkpoint status has been updated',
        severity: 'success'
      });
    },
  });

  const handleCheckpointClick = (checkpoint: {
    id: string;
    title: string;
    description: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    order: number;
  }) => {
    console.log('Selected checkpoint:', checkpoint);
    // Add missing properties to match Checkpoint type
    const fullCheckpoint: Checkpoint = {
      ...checkpoint,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedCheckpoint(fullCheckpoint);
    if (!exercises?.length) {
      generateExerciseMutation.mutate();
    }
  };

  const handleStatusUpdate = (checkpoint: Checkpoint, newStatus: string) => {
    updateCheckpointStatusMutation.mutate({ checkpointId: checkpoint.id, status: newStatus });
  };

  const getProgressPercentage = () => {
    if (!goal?.roadmap?.checkpoints) return 0;
    const completed = goal.roadmap.checkpoints.filter(cp => cp.status === 'COMPLETED').length;
    return (completed / goal.roadmap.checkpoints.length) * 100;
  };

  if (isLoadingGoal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <CircularProgress className="text-primary" />
          <Typography className="mt-4 text-text-secondary">Loading goal details...</Typography>
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
          <Typography className="text-text-secondary mb-4">Goal not found</Typography>
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Roadmap Sidebar */}
          <div className="md:col-span-4">
            <div className="bg-secondary-background rounded-lg shadow-md p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-text mb-4">Learning Progress</h3>
                  <div className="relative h-2 bg-background rounded">
                    <div
                      className="absolute top-0 left-0 h-full bg-primary rounded"
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {goal.roadmap?.checkpoints.map((checkpoint) => (
                    <div
                      key={checkpoint.id}
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedCheckpoint?.id === checkpoint.id
                          ? 'bg-primary bg-opacity-10'
                          : 'bg-secondary-background hover:bg-primary hover:bg-opacity-5'
                      }`}
                      onClick={() => handleCheckpointClick(checkpoint)}
                    >
                      <div className="space-y-2">
                        <span
                          className={`inline-flex px-2 py-1 text-sm rounded-full ${
                            checkpoint.status === 'COMPLETED'
                              ? 'bg-success text-success-contrast'
                              : checkpoint.status === 'IN_PROGRESS'
                              ? 'bg-primary text-primary-contrast'
                              : 'bg-background text-text-secondary'
                          }`}
                        >
                          {checkpoint.status}
                        </span>
                        <h4 className="text-text font-medium">{checkpoint.title}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-8">
            <div className="bg-secondary-background rounded-lg shadow-md p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-text mb-2">{goal.title}</h2>
                  <p className="text-text-secondary">{goal.description}</p>
                </div>

                {selectedCheckpoint ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-text mb-2">
                        {selectedCheckpoint.title}
                      </h3>
                      <p className="text-text-secondary mb-6">
                        {selectedCheckpoint.description}
                      </p>

                      <div className="flex gap-4 mb-6">
                        {selectedCheckpoint.status !== 'COMPLETED' && (
                          <Button
                            variant="contained"
                            className="bg-success hover:bg-success-dark text-success-contrast"
                            onClick={() => handleStatusUpdate(selectedCheckpoint, 'COMPLETED')}
                          >
                            Mark as Completed
                          </Button>
                        )}
                        {selectedCheckpoint.status === 'NOT_STARTED' && (
                          <Button
                            variant="contained"
                            className="bg-primary hover:bg-primary-dark text-primary-contrast"
                            onClick={() => handleStatusUpdate(selectedCheckpoint, 'IN_PROGRESS')}
                          >
                            Start Checkpoint
                          </Button>
                        )}
                      </div>
                    </div>

                    {isLoadingExercises ? (
                      <CircularProgress className="text-primary" />
                    ) : exercises?.length ? (
                      <div className="space-y-4">
                        {exercises.map((exercise) => (
                          <div
                            key={exercise.id}
                            className="bg-secondary-background rounded-lg shadow-md p-6 hover:bg-primary hover:bg-opacity-5 transition-colors"
                          >
                            <div className="space-y-4">
                              <h4 className="text-lg font-semibold text-text">
                                {exercise.title}
                              </h4>
                              <p className="text-text-secondary">{exercise.description}</p>
                              <div className="flex gap-2">
                                <span className="inline-flex px-3 py-1 text-sm rounded-full bg-primary text-primary-contrast">
                                  {exercise.language.name}
                                </span>
                                <span
                                  className={`inline-flex px-3 py-1 text-sm rounded-full ${
                                    exercise.difficulty === 'EASY'
                                      ? 'bg-success text-success-contrast'
                                      : exercise.difficulty === 'MEDIUM'
                                      ? 'bg-warning text-warning-contrast'
                                      : 'bg-error text-error-contrast'
                                  }`}
                                >
                                  {exercise.difficulty}
                                </span>
                              </div>
                              <Button
                                variant="contained"
                                className="bg-primary hover:bg-primary-dark text-primary-contrast"
                                onClick={() => setModalOpen(true)}
                              >
                                Start Exercise
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Button
                        variant="contained"
                        className="bg-primary hover:bg-primary-dark text-primary-contrast"
                        onClick={() => generateExerciseMutation.mutate()}
                        disabled={generateExerciseMutation.isPending}
                      >
                        {generateExerciseMutation.isPending ? (
                          <CircularProgress size={24} className="text-primary-contrast" />
                        ) : (
                          'Generate Exercise'
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Typography className="text-text-secondary">
                      Select a checkpoint to view details and exercises
                    </Typography>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Exercise Modal */}
        <Dialog
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          maxWidth="xl"
          fullWidth
          className="bg-background"
        >
          <DialogTitle className="bg-secondary-background border-b border-border">
            <div className="flex justify-between items-center">
              <span className="text-text font-semibold">Exercise</span>
              <IconButton
                onClick={() => setModalOpen(false)}
                className="text-text-secondary hover:text-text"
              >
                <CloseIcon />
              </IconButton>
            </div>
          </DialogTitle>
          <DialogContent className="bg-secondary-background">
            {selectedCheckpoint && exercises?.[0] && (
              <Typography className="text-text mt-4">
                Exercise content for {exercises[0].title}
              </Typography>
            )}
          </DialogContent>
        </Dialog>

        {/* Toast */}
        <Snackbar
          open={toast.open}
          autoHideDuration={3000}
          onClose={() => setToast(prev => ({ ...prev, open: false }))}
        >
          <Alert
            severity={toast.severity}
            onClose={() => setToast(prev => ({ ...prev, open: false }))}
            className={`${
              toast.severity === 'success' ? 'bg-success' : 'bg-error'
            } text-white`}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
}; 