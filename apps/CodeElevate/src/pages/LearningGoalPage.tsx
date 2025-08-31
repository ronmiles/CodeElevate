import {
  Alert,
  Button,
  CircularProgress,
  Snackbar,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Exercise, exercisesApi } from '../api/exercises.api';
import { goalsApi, LearningGoal } from '../api/goals.api';
import { Checkpoint } from '../api/roadmap.api';
import { ExerciseDetailsOverlay } from '../components/ExerciseDetailsModal';
import { Navbar } from '../components/layout/Navbar';
import { useAuth } from '../hooks/useAuth';
import { ExerciseProvider } from '../contexts/ExerciseContext';
import LearningPathSidebar from '../components/learning/LearningPathSidebar';
import ExercisesList from '../components/learning/ExercisesList';
import { LearningMaterialView } from '../components/learning/LearningMaterialView';
import {
  ContentToggle,
  ContentType,
} from '../components/learning/ContentToggle';
import {
  learningMaterialsApi,
  LearningMaterial,
} from '../api/learningMaterials.api';
import { BookOpen, Code2 } from 'lucide-react';

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
  const location = useLocation();
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

  // Add state to store checkpoint exercises data
  const [checkpointExercisesMap, setCheckpointExercisesMap] = useState<
    Record<string, Exercise[]>
  >({});

  // Learning materials state
  const [activeContent, setActiveContent] = useState<ContentType>('material');
  const [learningMaterial, setLearningMaterial] =
    useState<LearningMaterial | null>(null);
  const [isLoadingLearningMaterial, setIsLoadingLearningMaterial] =
    useState(false);

  const {
    data: goal,
    isLoading: isLoadingGoal,
    error: goalError,
    refetch: refetchGoal,
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

  // Add effect to fetch exercises for all checkpoints
  useEffect(() => {
    const fetchAllCheckpointExercises = async () => {
      if (!goal?.roadmap?.checkpoints || !token) return;

      const exercisesMap: Record<string, Exercise[]> = {};

      // Create promises for all checkpoint exercise fetches
      const promises = goal.roadmap.checkpoints.map(async (checkpoint) => {
        try {
          const exercises = await exercisesApi.getCheckpointExercises(
            checkpoint.id,
            token
          );
          exercisesMap[checkpoint.id] = exercises;
        } catch (error) {
          console.error(
            `Error fetching exercises for checkpoint ${checkpoint.id}:`,
            error
          );
          exercisesMap[checkpoint.id] = [];
        }
      });

      // Wait for all fetches to complete
      if (promises) {
        await Promise.all(promises);
      }

      setCheckpointExercisesMap(exercisesMap);
    };

    fetchAllCheckpointExercises();
  }, [goal?.roadmap?.checkpoints, token]);

  // Add effect to refetch goal data when navigating back from exercise page
  useEffect(() => {
    // Refetch goal data when returning to this page from an exercise
    if (goalId && token) {
      refetchGoal();

      // Also refresh checkpoint exercises data
      if (goal?.roadmap?.checkpoints) {
        const fetchAllCheckpointExercises = async () => {
          const exercisesMap: Record<string, Exercise[]> = {};

          const promises = goal.roadmap?.checkpoints.map(async (checkpoint) => {
            try {
              const exercises = await exercisesApi.getCheckpointExercises(
                checkpoint.id,
                token
              );
              exercisesMap[checkpoint.id] = exercises;
            } catch (error) {
              console.error(
                `Error fetching exercises for checkpoint ${checkpoint.id}:`,
                error
              );
              exercisesMap[checkpoint.id] = [];
            }
          });

          if (promises) {
            await Promise.all(promises);
          }

          setCheckpointExercisesMap(exercisesMap);
        };

        fetchAllCheckpointExercises();
      }
    }
  }, [
    refetchGoal,
    goalId,
    token,
    location.pathname,
    goal?.roadmap?.checkpoints,
  ]);

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

        // Fetch learning material for this checkpoint
        fetchLearningMaterial(checkpointId);

        // Auto-select appropriate content tab based on availability
        setActiveContent('material'); // Always start with learning materials for proper learning flow
      }
    }
  }, [goal, checkpointId]);

  const fetchLearningMaterial = async (checkpointId: string) => {
    if (!token) return;

    try {
      setIsLoadingLearningMaterial(true);
      const material = await learningMaterialsApi.getLearningMaterial(
        checkpointId,
        token
      );
      setLearningMaterial(material);
    } catch (error) {
      // Learning material might not exist yet, which is okay
      console.log('Learning material not found, will need to generate it');
      setLearningMaterial(null);
    } finally {
      setIsLoadingLearningMaterial(false);
    }
  };

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
      exercisesApi.generateExercise(goalId!, selectedCheckpoint!.id, token!),
    onSuccess: async (newExercise) => {
      queryClient.invalidateQueries({
        queryKey: ['exercises', selectedCheckpoint?.id],
      });

      // Update local exercise map with the new exercise
      if (selectedCheckpoint) {
        const currentExercises =
          checkpointExercisesMap[selectedCheckpoint.id] || [];
        setCheckpointExercisesMap({
          ...checkpointExercisesMap,
          [selectedCheckpoint.id]: [...currentExercises, newExercise],
        });
      }

      // Refetch goal to show updated checkpoint status from server
      refetchGoal();

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

  const generateLearningMaterialMutation = useMutation({
    mutationFn: () =>
      learningMaterialsApi.generateLearningMaterial(
        selectedCheckpoint!.id,
        token!
      ),
    onSuccess: (newLearningMaterial) => {
      setLearningMaterial(newLearningMaterial);
      setToast({
        open: true,
        message: 'Learning material has been generated for this checkpoint',
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

      // Fetch or generate learning material
      await fetchLearningMaterial(checkpoint.id);

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
        message: 'Error loading checkpoint content. Please try again.',
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
      <div className="min-h-screen">
        <div className="bg-background">
          <Navbar />
        </div>
        <div className="bg-background flex flex-col">
          <div className="flex flex-1 overflow-hidden">
            <LearningPathSidebar
              checkpoints={goal.roadmap?.checkpoints || []}
              checkpointExercisesMap={checkpointExercisesMap}
              selectedCheckpointId={selectedCheckpoint?.id || null}
              onCheckpointClick={handleCheckpointClick}
            />

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

                  {/* Content Toggle */}
                  <ContentToggle
                    activeContent={activeContent}
                    onToggle={setActiveContent}
                    hasLearningMaterial={!!learningMaterial}
                    exerciseCount={exercises?.length || 0}
                    completedExercises={
                      exercises?.filter(
                        (ex) =>
                          ex.progress &&
                          ex.progress.length > 0 &&
                          ex.progress[0].grade !== undefined &&
                          ex.progress[0].grade >= 70
                      ).length || 0
                    }
                  />

                  {/* Content Area */}
                  {activeContent === 'material' ? (
                    <div>
                      {learningMaterial ? (
                        <LearningMaterialView
                          learningMaterial={learningMaterial}
                          isLoading={isLoadingLearningMaterial}
                        />
                      ) : (
                        <div className="text-center py-12">
                          <div className="mb-4">
                            <BookOpen className="w-16 h-16 mx-auto text-text-secondary mb-4" />
                            <h3 className="text-lg font-semibold text-text mb-2">
                              No Learning Material Yet
                            </h3>
                            <p className="text-text-secondary mb-6">
                              Generate learning material to help you understand
                              this checkpoint before tackling the exercises.
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              generateLearningMaterialMutation.mutate()
                            }
                            disabled={
                              generateLearningMaterialMutation.isPending
                            }
                            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                          >
                            {generateLearningMaterialMutation.isPending ? (
                              <>
                                <div className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Generating...
                              </>
                            ) : (
                              'Generate Learning Material'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {exercises && exercises.length > 0 ? (
                        <ExercisesList
                          exercises={exercises}
                          isLoading={isLoadingExercises}
                          isPendingGeneration={
                            generateExerciseMutation.isPending
                          }
                          onGenerateExercise={() =>
                            generateExerciseMutation.mutate()
                          }
                          containerRef={containerRef}
                          onScroll={scroll}
                        />
                      ) : (
                        <div className="text-center py-12">
                          <div className="mb-4">
                            <Code2 className="w-16 h-16 mx-auto text-text-secondary mb-4" />
                            <h3 className="text-lg font-semibold text-text mb-2">
                              No Exercises Yet
                            </h3>
                            <p className="text-text-secondary mb-6">
                              Generate exercises to practice the concepts you've
                              learned in this checkpoint.
                            </p>
                          </div>
                          <button
                            onClick={() => generateExerciseMutation.mutate()}
                            disabled={generateExerciseMutation.isPending}
                            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                          >
                            {generateExerciseMutation.isPending ? (
                              <>
                                <div className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Generating...
                              </>
                            ) : (
                              'Generate Exercise'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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
      </div>
    </>
  );
};
