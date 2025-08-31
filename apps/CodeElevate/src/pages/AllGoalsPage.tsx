import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { goalsApi, LearningGoal } from '../api/goals.api';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { useNavigate } from 'react-router-dom';

const AllGoalsPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsApi.getGoals(token!),
    enabled: !!token,
  });

  const handleGoalClick = (goal: LearningGoal) => {
    const firstCheckpointId = goal?.roadmap?.checkpoints?.[0]?.id;
    if (firstCheckpointId) {
      navigate(`/goal/${goal.id}/checkpoint/${firstCheckpointId}`);
    }
  };

  const sortedGoals = React.useMemo(() => {
    if (!goals) return [] as LearningGoal[];
    return [...goals].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [goals]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-semibold text-text">All Goals</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm font-medium hover:scale-[1.05] transition-all duration-200"
            >
              ← Back to Dashboard
            </button>
          </div>

          {isLoading ? (
            <div className="text-center text-text-secondary">
              Loading goals...
            </div>
          ) : !sortedGoals.length ? (
            <div className="text-center text-text-secondary">No goals yet.</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-2xl bg-primary-background/80 backdrop-blur border border-border p-6 hover:shadow-lg transition-all duration-200 hover:cursor-pointer hover:bg-secondary-background/90 hover:scale-105 flex flex-col h-full"
                  onClick={() => handleGoalClick(goal)}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-text">
                      {goal.title}
                    </h3>
                    <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">
                      {goal.language?.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  {goal.description && (
                    <p className="mt-2 text-sm text-text-secondary line-clamp-3">
                      {goal.description}
                    </p>
                  )}
                  <div className="mt-auto pt-4">
                    <div
                      className={`w-fit px-3 py-1 rounded-full text-sm font-medium text-center ${
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

export default AllGoalsPage;
