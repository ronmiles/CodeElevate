import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import {
  goalsApi,
  CreateGoalData,
  CustomizationAnswer,
  CustomizationQuestion,
  CreateCustomizedGoalData,
} from '../api/goals.api';
import { useAuth } from '../contexts/AuthContext';
import { SparkleIcon } from '../components/common/SparkleIcon';
import { CustomizationQuestions } from '../components/dashboard/CustomizationQuestions';
import { getIsNewDesign } from '../utils/featureFlags';

type GoalCreationStep = 'form' | 'questions';

export const NewGoalPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState<GoalCreationStep>('form');
  const [error, setError] = useState<string | null>(null);
  const [isEnhancingDescription, setIsEnhancingDescription] = useState(false);
  const [customizationQuestions, setCustomizationQuestions] = useState<
    CustomizationQuestion[]
  >([]);
  const [newGoal, setNewGoal] = useState<CreateGoalData>({
    title: '',
    description: '',
    deadline: '',
  });

  // Guard this screen behind feature flag
  useEffect(() => {
    const isNew = getIsNewDesign();
    if (!isNew) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

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
    onError: (err: Error) => {
      setError(err.message);
      // eslint-disable-next-line no-console
      console.error('Failed to generate questions:', err);
    },
  });

  const createCustomizedGoalMutation = useMutation({
    mutationFn: (data: CreateCustomizedGoalData) =>
      goalsApi.createCustomizedGoal(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      navigate('/dashboard', { replace: true });
    },
    onError: (err: Error) => {
      setError(err.message);
      // eslint-disable-next-line no-console
      console.error('Failed to create customized goal:', err);
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: (data: CreateGoalData) => goalsApi.createGoal(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      navigate('/dashboard', { replace: true });
    },
    onError: (err: Error) => {
      setError(err.message);
      // eslint-disable-next-line no-console
      console.error('Failed to create goal:', err);
    },
  });

  const handleSubmitInitialGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!token) throw new Error('You must be logged in to create a goal');
      if (!newGoal.title.trim()) throw new Error('Goal title is required');

      const goalData: CreateGoalData = {
        title: newGoal.title.trim(),
        description: newGoal.description?.trim() || undefined,
        deadline: newGoal.deadline || undefined,
      };

      await generateQuestionsMutation.mutateAsync(goalData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate questions'
      );
    }
  };

  const handleSkipCustomization = async () => {
    try {
      if (!token) throw new Error('You must be logged in to create a goal');

      const goalData: CreateGoalData = {
        title: newGoal.title.trim(),
        description: newGoal.description?.trim() || undefined,
        deadline: newGoal.deadline || undefined,
      };

      await createGoalMutation.mutateAsync(goalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal');
    }
  };

  const handleCustomizationSubmit = async (answers: CustomizationAnswer[]) => {
    try {
      if (!token) throw new Error('You must be logged in to create a goal');

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
    }
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
    } finally {
      setIsEnhancingDescription(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-3xl mx-auto py-10 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-text">Create Goal</h1>
              <p className="text-sm text-text-secondary mt-1">
                Define your goal and optionally customize it for a tailored
                roadmap.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text hover:bg-background border border-border transition-all duration-200"
            >
              Cancel
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-error">
              {error}
            </div>
          )}

          {currentStep === 'form' && (
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
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, title: e.target.value })
                    }
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
                        className="h-9 px-3 rounded-md flex items-center gap-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
          )}

          {currentStep === 'questions' && (
            <div className="mb-8">
              <div className="mb-6 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-text">
                    Customize Your Goal: {newGoal.title}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Help us create a personalized learning roadmap by answering
                    a few quick questions
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
        </div>
      </main>
    </div>
  );
};

export default NewGoalPage;
