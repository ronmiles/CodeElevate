import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  goalsApi,
  LearningGoal,
  CreateGoalData,
  CustomizationQuestion,
  CustomizationAnswer,
  CreateCustomizedGoalData,
} from '../../api/goals.api';
import { Navbar } from '../layout/Navbar';
import { SparkleIcon } from '../common/SparkleIcon';
import { CustomizationQuestions } from './CustomizationQuestions';

type GoalCreationStep = 'form' | 'questions';

export const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [currentStep, setCurrentStep] = useState<GoalCreationStep>('form');
  const [error, setError] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState<CreateGoalData>({
    title: '',
    description: '',
    deadline: '',
  });
  const [customizationQuestions, setCustomizationQuestions] = useState<
    CustomizationQuestion[]
  >([]);
  const [isEnhancingDescription, setIsEnhancingDescription] = useState(false);

  const { data: goals, isLoading: isLoadingGoals } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsApi.getGoals(token!),
    enabled: !!token,
  });

  const generateQuestionsMutation = useMutation({
    mutationFn: (data: CreateGoalData) =>
      goalsApi.generateCustomizationQuestions(
        data.title,
        data.description,
        token!
      ),
    onSuccess: (questions) => {
      setCustomizationQuestions(questions);
      setCurrentStep('questions');
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
      console.error('Failed to generate questions:', error);
    },
  });

  const createCustomizedGoalMutation = useMutation({
    mutationFn: (data: CreateCustomizedGoalData) =>
      goalsApi.createCustomizedGoal(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      resetForm();
    },
    onError: (error: Error) => {
      setError(error.message);
      console.error('Failed to create customized goal:', error);
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: (data: CreateGoalData) => goalsApi.createGoal(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      resetForm();
    },
    onError: (error: Error) => {
      setError(error.message);
      console.error('Failed to create goal:', error);
    },
  });

  const resetForm = () => {
    setIsAddingGoal(false);
    setCurrentStep('form');
    setNewGoal({ title: '', description: '', deadline: '' });
    setCustomizationQuestions([]);
    setError(null);
  };

  const handleSubmitInitialGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!token) {
        throw new Error('You must be logged in to create a goal');
      }

      if (!newGoal.title.trim()) {
        throw new Error('Goal title is required');
      }

      const goalData: CreateGoalData = {
        title: newGoal.title.trim(),
        description: newGoal.description?.trim() || undefined,
        deadline: newGoal.deadline || undefined,
      };

      // Generate customization questions instead of creating goal directly
      await generateQuestionsMutation.mutateAsync(goalData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate questions'
      );
      console.error('Error in handleSubmitInitialGoal:', err);
    }
  };

  const handleSkipCustomization = async () => {
    try {
      if (!token) {
        throw new Error('You must be logged in to create a goal');
      }

      const goalData: CreateGoalData = {
        title: newGoal.title.trim(),
        description: newGoal.description?.trim() || undefined,
        deadline: newGoal.deadline || undefined,
      };

      await createGoalMutation.mutateAsync(goalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal');
      console.error('Error in handleSkipCustomization:', err);
    }
  };

  const handleCustomizationSubmit = async (answers: CustomizationAnswer[]) => {
    try {
      if (!token) {
        throw new Error('You must be logged in to create a goal');
      }

      const customizedGoalData: CreateCustomizedGoalData = {
        title: newGoal.title.trim(),
        description: newGoal.description?.trim() || undefined,
        deadline: newGoal.deadline || undefined,
        customizationAnswers: answers,
      };

      await createCustomizedGoalMutation.mutateAsync(customizedGoalData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create customized goal'
      );
      console.error('Error in handleCustomizationSubmit:', err);
    }
  };

  const handleGoalClick = (goalId: string) => {
    const goal = goals?.find((g) => g.id === goalId);
    const firstCheckpointId = goal?.roadmap?.checkpoints[0]?.id;

    navigate(`/goal/${goalId}/checkpoint/${firstCheckpointId}`);
  };

  const handleEnhanceDescription = async () => {
    if (!token) {
      setError('You must be logged in to use this feature');
      return;
    }

    if (!newGoal.title.trim()) {
      setError('Goal title is required for AI description generation');
      return;
    }

    setIsEnhancingDescription(true);
    setError(null);

    try {
      const enhancedDescription = await goalsApi.enhanceDescription(
        newGoal.title.trim(),
        newGoal.description?.trim() || undefined,
        token
      );

      setNewGoal({
        ...newGoal,
        description: enhancedDescription,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to enhance description'
      );
      console.error('Error enhancing description:', err);
    } finally {
      setIsEnhancingDescription(false);
    }
  };

  const renderGoalForm = () => (
    <form
      onSubmit={handleSubmitInitialGoal}
      className="mb-8 bg-secondary-background p-6 rounded-lg border border-border"
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-text mb-1"
          >
            Goal Title
          </label>
          <input
            type="text"
            id="title"
            value={newGoal.title}
            onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
            className="auth-input"
            placeholder="Enter your learning goal"
            required
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-text mb-1"
          >
            Description
          </label>
          <div className="space-y-2">
            <textarea
              id="description"
              value={newGoal.description}
              onChange={(e) =>
                setNewGoal({ ...newGoal, description: e.target.value })
              }
              className="auth-input min-h-[100px] w-full"
              placeholder="Describe your goal in detail"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleEnhanceDescription}
                disabled={isEnhancingDescription}
                className="h-9 px-3 rounded-md flex items-center gap-1.5 text-xs font-medium text-white hover:bg-primary shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Use AI to enhance your goal description"
              >
                <SparkleIcon />
                {isEnhancingDescription
                  ? 'Writing...'
                  : newGoal.description
                  ? 'Enhance with AI'
                  : 'Write with AI'}
              </button>
            </div>
          </div>
        </div>
        <div>
          <label
            htmlFor="deadline"
            className="block text-sm font-medium text-text mb-1"
          >
            Deadline (Optional)
          </label>
          <input
            type="date"
            id="deadline"
            value={newGoal.deadline}
            onChange={(e) =>
              setNewGoal({ ...newGoal, deadline: e.target.value })
            }
            className="auth-input"
          />
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text hover:bg-background transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={generateQuestionsMutation.isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-all duration-200 disabled:opacity-50"
          >
            {generateQuestionsMutation.isPending
              ? 'Generating...'
              : 'Continue to Customization'}
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-text">Learning Goals</h2>
            {!isAddingGoal && (
              <button
                onClick={() => setIsAddingGoal(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-all duration-200"
              >
                Add New Goal
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-error">
              {error}
            </div>
          )}

          {isAddingGoal && (
            <>
              {currentStep === 'form' && renderGoalForm()}

              {currentStep === 'questions' && (
                <div className="mb-8">
                  <div className="mb-6 flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-text">
                        Customize Your Goal: {newGoal.title}
                      </h3>
                      <p className="text-sm text-text-secondary mt-1">
                        Help us create a personalized learning roadmap by
                        answering a few quick questions
                      </p>
                    </div>
                    <button
                      onClick={handleSkipCustomization}
                      disabled={createGoalMutation.isPending}
                      className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text hover:bg-background border border-border rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      Skip & Create Basic Goal
                    </button>
                  </div>

                  <CustomizationQuestions
                    questions={customizationQuestions}
                    onSubmit={handleCustomizationSubmit}
                    onBack={() => setCurrentStep('form')}
                    isLoading={createCustomizedGoalMutation.isPending}
                  />
                </div>
              )}
            </>
          )}

          {isLoadingGoals ? (
            <div className="text-center text-text-secondary">
              Loading goals...
            </div>
          ) : goals?.length === 0 ? (
            <div className="text-center text-text-secondary">
              No learning goals yet. Add your first goal!
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {goals?.map((goal: LearningGoal) => (
                <div
                  key={goal.id}
                  className="bg-secondary-background p-6 rounded-lg border border-border cursor-pointer hover:shadow-lg transition-all duration-200"
                  onClick={() => handleGoalClick(goal.id)}
                >
                  <h3 className="text-lg font-medium text-text mb-2">
                    {goal.title}
                  </h3>
                  {goal.description && (
                    <p className="text-text-secondary mb-4 text-sm">
                      {goal.description}
                    </p>
                  )}
                  {goal.deadline && (
                    <p className="text-sm text-text-secondary mb-4">
                      Deadline: {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  )}
                  <div className="flex justify-between items-center">
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        goal.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : goal.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : goal.status === 'ABANDONED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {goal.status.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
