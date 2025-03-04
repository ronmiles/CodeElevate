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
import { exercisesApi, Exercise } from '../api/exercises.api';
import { useAuth } from '../hooks/useAuth';
import { Checkpoint } from '../api/roadmap.api';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';

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
  const containerRef = React.useRef<HTMLDivElement>(null);


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
    queryKey: ['exercises', selectedCheckpoint?.id],
    queryFn: () => exercisesApi.getCheckpointExercises(selectedCheckpoint!.id, token!),
    enabled: !!selectedCheckpoint && !!token,
  });

  const generateExerciseMutation = useMutation({
    mutationFn: () =>
      exercisesApi.generateExercise(goalId!, goal!.preferredLanguage.id, selectedCheckpoint!.id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises', selectedCheckpoint?.id] });
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

  const handleCheckpointClick = async (checkpoint: {
    id: string;
    title: string;
    description: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    order: number;
  }) => {
    console.log('Selected checkpoint:', checkpoint);
    const fullCheckpoint: Checkpoint = {
      ...checkpoint,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedCheckpoint(fullCheckpoint);
    
    // Check if exercises exist before generating
    const existingExercises = await exercisesApi.getCheckpointExercises(checkpoint.id, token!);
    if (!existingExercises?.length) {
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
    <>
      <style>{scrollbarStyles}</style>
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex flex-1 my-3 w-full px-3 overflow-hidden">
          {/* Sidebar with checkpoints */}
          <div 
            className="w-64 bg-secondary-background rounded-lg p-4 mr-3 flex-shrink-0 overflow-y-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(75, 85, 99, 0.5) rgba(17, 24, 39, 0.1)'
            }}
          >
            <h2 className="text-lg font-semibold text-text mb-4">Learning Path</h2>
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
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      checkpoint.status === 'COMPLETED' 
                        ? 'bg-green-100 text-green-800' 
                        : checkpoint.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {checkpoint.status.replace('_', ' ')}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 p-6 rounded-lg overflow-y-auto">
            {selectedCheckpoint ? (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-text mb-4">{selectedCheckpoint.title}</h1>
                  <p className="text-text-secondary">{selectedCheckpoint.description}</p>
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

                  {/* Updated Exercise carousel */}
                  <div
                    ref={containerRef}
                    className="overflow-x-auto flex space-x-4 pb-4 px-8 scrollbar-hide"
                  >
                    {isLoadingExercises ? (
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
                      <>
                        {exercises?.map((exercise: Exercise) => (
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
                        ))}

                        {/* Generate More Card */}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-shrink-0 w-72 bg-secondary-background rounded-lg p-4 cursor-pointer border-2 border-dashed border-primary hover:border-primary-hover"
                          onClick={() => generateExerciseMutation.mutate()}
                        >
                          <div className="h-full flex flex-col items-center justify-center text-center p-4">
                            <div className="w-12 h-12 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mb-4">
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
                            </div>
                            <h3 className="font-semibold text-text mb-2">Generate More</h3>
                            <p className="text-sm text-text-secondary">
                              Create a new exercise for this checkpoint
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
    </>
  );
}; 