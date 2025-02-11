import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsApi, LearningGoal, CreateGoalData } from '../../api/goals.api';

export const Dashboard: React.FC = () => {
  const { signOut, token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState<CreateGoalData>({
    title: '',
    description: '',
    deadline: '',
  });

  const { data: goals, isLoading: isLoadingGoals } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsApi.getGoals(token!),
    enabled: !!token,
  });

  const createGoalMutation = useMutation({
    mutationFn: (data: CreateGoalData) => goalsApi.createGoal(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsAddingGoal(false);
      setNewGoal({ title: '', description: '', deadline: '' });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
      console.error('Failed to create goal:', error);
    },
  });

  const updateGoalStatusMutation = useMutation({
    mutationFn: ({ goalId, status }: { goalId: string; status: LearningGoal['status'] }) =>
      goalsApi.updateGoalStatus(goalId, status, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: (error: Error) => {
      console.error('Failed to update goal status:', error);
    },
  });

  const handleSignOut = () => {
    signOut();
    navigate('/signin');
  };

  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (!token) {
        throw new Error('You must be logged in to create a goal');
      }
      
      if (!newGoal.title.trim()) {
        throw new Error('Goal title is required');
      }

      // Clean up the goal data before submission
      const goalData: CreateGoalData = {
        title: newGoal.title.trim(),
        description: newGoal.description?.trim() || undefined,
        deadline: newGoal.deadline || undefined,
      };

      await createGoalMutation.mutateAsync(goalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal');
      console.error('Error in handleSubmitGoal:', err);
    }
  };

  const handleStatusChange = (goalId: string, status: LearningGoal['status']) => {
    updateGoalStatusMutation.mutate({ goalId, status });
  };

  const handleGoalClick = (goalId: string) => {
    console.log('Goal clicked:', goalId);
    console.log('Current token:', token);
    console.log('Navigating to:', `/goal/${goalId}`);
    navigate(`/goal/${goalId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-secondary-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-text">CodeElevate</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleSignOut}
                className="ml-4 px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text hover:bg-background transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

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
            <form onSubmit={handleSubmitGoal} className="mb-8 bg-secondary-background p-6 rounded-lg border border-border">
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-text mb-1">
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
                  <label htmlFor="description" className="block text-sm font-medium text-text mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    className="auth-input min-h-[100px]"
                    placeholder="Describe your goal in detail"
                  />
                </div>
                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium text-text mb-1">
                    Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    id="deadline"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    className="auth-input"
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingGoal(false);
                      setError(null);
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text hover:bg-background transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createGoalMutation.isPending}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-all duration-200 disabled:opacity-50"
                  >
                    {createGoalMutation.isPending ? 'Adding...' : 'Add Goal'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {isLoadingGoals ? (
            <div className="text-center text-text-secondary">Loading goals...</div>
          ) : goals?.length === 0 ? (
            <div className="text-center text-text-secondary">No learning goals yet. Add your first goal!</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {goals?.map((goal: LearningGoal) => (
                <div
                  key={goal.id}
                  className="bg-secondary-background p-6 rounded-lg border border-border cursor-pointer hover:shadow-lg transition-all duration-200"
                  onClick={() => handleGoalClick(goal.id)}
                >
                  <h3 className="text-lg font-medium text-text mb-2">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-text-secondary mb-4 text-sm">{goal.description}</p>
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