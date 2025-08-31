import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { goalsApi, LearningGoal } from '../../api/goals.api';
import { useAuth } from '../../contexts/AuthContext';
import { Navbar } from '../layout/Navbar';
import { useNavigate } from 'react-router-dom';

import backgroundLogo from '../../assets/background-logo.svg';

const LS_KEY = 'dashboard:useNew';

export const NewDashboard: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const isNew =
    typeof window !== 'undefined' && localStorage.getItem(LS_KEY) === 'true';

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsApi.getGoals(token!),
    enabled: !!token,
  });

  const disableNewDesign = () => {
    localStorage.setItem(LS_KEY, 'false');
    // Simple refresh to re-evaluate entry component
    window.location.reload();
  };

  const handleGoalClick = (goal: LearningGoal) => {
    const firstCheckpointId = goal?.roadmap?.checkpoints?.[0]?.id;
    if (firstCheckpointId) {
      navigate(`/goal/${goal.id}/checkpoint/${firstCheckpointId}`);
    }
  };

  return (
    <div
      className="min-h-screen bg-background"
      style={
        isNew
          ? {
              backgroundImage: `url(${backgroundLogo})`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right -120px bottom -80px',
              backgroundSize: '60%',
            }
          : undefined
      }
    >
      <Navbar />

      <main className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-semibold text-text">My Goals</h1>
            <button
              onClick={disableNewDesign}
              className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text hover:bg-background border border-border transition-all duration-200"
            >
              Use classic dashboard
            </button>
          </div>

          {isLoading ? (
            <div className="text-center text-text-secondary">
              Loading goals...
            </div>
          ) : !goals || goals.length === 0 ? (
            <div className="text-center text-text-secondary">
              No learning goals yet. Create one to get started.
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {goals.map((goal: LearningGoal) => (
                  <div
                    key={goal.id}
                    // on hover scale()
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

              <div className="mt-10 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl bg-secondary-background/70 border border-border p-6 h-52">
                  <div className="text-text font-semibold">
                    Your Strong Points
                  </div>
                </div>
                <div className="rounded-2xl bg-secondary-background/70 border border-border p-6 h-52">
                  <div className="text-text font-semibold">
                    Skills to Strengthen
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default NewDashboard;
