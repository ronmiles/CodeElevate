import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { goalsApi, LearningGoal, insightsApi } from '../../api/goals.api';
import { exercisesApi, UserProgressResponse } from '../../api/exercises.api';
import { useAuth } from '../../contexts/AuthContext';
import { Navbar } from '../layout/Navbar';
import { useNavigate } from 'react-router-dom';

import logo from '../../assets/logo.svg';
import { getIsNewDesign, setIsNewDesign } from '../../utils/featureFlags';

export const NewDashboard: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const isNew = getIsNewDesign();

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsApi.getGoals(token!),
    enabled: !!token,
  });

  const { data: progressData } = useQuery<UserProgressResponse | undefined>({
    queryKey: ['userProgress'],
    queryFn: () => exercisesApi.getUserProgress(token!),
    enabled: !!token,
  });

  const { data: aiInsights, isLoading: isInsightsLoading } = useQuery({
    queryKey: ['dashboardInsights'],
    queryFn: () => insightsApi.getDashboardInsights(token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 30,
  });

  const { strongPoints, skillsToImprove } = React.useMemo(() => {
    if (
      aiInsights &&
      (aiInsights.strongPoints.length || aiInsights.skillsToStrengthen.length)
    ) {
      return {
        strongPoints: aiInsights.strongPoints.slice(0, 3),
        skillsToImprove: aiInsights.skillsToStrengthen.slice(0, 3),
      };
    }
    const result = {
      strongPoints: [] as string[],
      skillsToImprove: [] as string[],
    };
    const list = progressData?.progress || [];

    if (!list.length) return result;

    const byLanguage: Record<
      string,
      { attempted: number; completed: number; grades: number[] }
    > = {};
    const byDifficulty: Record<
      string,
      { attempted: number; completed: number; grades: number[] }
    > = {};

    for (const p of list) {
      const lang = p.exercise.language || 'Unknown';
      const diff = p.exercise.difficulty || 'UNKNOWN';
      byLanguage[lang] = byLanguage[lang] || {
        attempted: 0,
        completed: 0,
        grades: [],
      };
      byDifficulty[diff] = byDifficulty[diff] || {
        attempted: 0,
        completed: 0,
        grades: [],
      };

      byLanguage[lang].attempted++;
      byDifficulty[diff].attempted++;

      if (p.status === 'COMPLETED') {
        byLanguage[lang].completed++;
        byDifficulty[diff].completed++;
        if (typeof p.grade === 'number') {
          byLanguage[lang].grades.push(p.grade);
          byDifficulty[diff].grades.push(p.grade);
        }
      }
    }

    const toItems = (
      map: Record<
        string,
        { attempted: number; completed: number; grades: number[] }
      >,
      label: (k: string) => string
    ) => {
      const items: Array<{
        key: string;
        attempted: number;
        completed: number;
        avg: number;
        rate: number;
        text: string;
      }> = [];
      for (const key of Object.keys(map)) {
        const s = map[key];
        const avg = s.grades.length
          ? s.grades.reduce((a, b) => a + b, 0) / s.grades.length
          : 0;
        const rate = s.attempted ? s.completed / s.attempted : 0;
        const text = `${label(key)} — ${s.completed}/${
          s.attempted
        } completed, avg grade ${Math.round(avg)}`;
        items.push({
          key,
          attempted: s.attempted,
          completed: s.completed,
          avg,
          rate,
          text,
        });
      }
      return items;
    };

    const langItems = toItems(byLanguage, (k) => `Language ${k}`);
    const diffItems = toItems(byDifficulty, (k) => `Difficulty ${k}`);

    const strengths = [...langItems, ...diffItems]
      .filter((i) => i.attempted >= 2 && (i.avg >= 80 || i.rate >= 0.8))
      .sort((a, b) => b.avg - a.avg || b.rate - a.rate)
      .slice(0, 4)
      .map((i) => i.text);

    const weaknesses = [...langItems, ...diffItems]
      .filter(
        (i) => i.attempted >= 2 && ((i.avg > 0 && i.avg < 65) || i.rate < 0.5)
      )
      .sort((a, b) => a.avg - b.avg || a.rate - b.rate)
      .slice(0, 4)
      .map((i) => i.text);

    return { strongPoints: strengths, skillsToImprove: weaknesses };
  }, [progressData]);

  const disableNewDesign = () => {
    setIsNewDesign(false);
    // Simple refresh to re-evaluate entry component
    window.location.reload();
  };

  const handleGoalClick = (goal: LearningGoal) => {
    const firstCheckpointId = goal?.roadmap?.checkpoints?.[0]?.id;
    if (firstCheckpointId) {
      navigate(`/goal/${goal.id}/checkpoint/${firstCheckpointId}`);
    }
  };

  // Latest three goals by creation date
  const latestGoals = React.useMemo(() => {
    if (!goals || goals.length === 0) return [] as LearningGoal[];
    const sorted = [...goals].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted.slice(0, 3);
  }, [goals]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-semibold text-text">My Goals</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard/new-goal')}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-all duration-200 z-10"
              >
                Add New Goal
              </button>
              <button
                onClick={disableNewDesign}
                className="px-4 py-2 bg-background rounded-lg text-sm font-medium text-text-secondary hover:text-text hover:bg-background-hover border border-border transition-all duration-200 z-10"
              >
                Return to Classic Design
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center text-text-secondary">
              Loading goals...
            </div>
          ) : !goals || goals.length === 0 ? (
            <div className="text-center text-text-secondary">
              <p>No learning goals yet. Create one to get started.</p>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/dashboard/new-goal')}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-all duration-200"
                >
                  Add New Goal
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {latestGoals.map((goal: LearningGoal) => (
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

              {!!goals && goals.length > 3 && (
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => navigate('/dashboard/goals')}
                    className="text-sm font-medium hover:scale-[1.05] transition-all duration-200 mr-2"
                  >
                    All Goals →
                  </button>
                </div>
              )}

              <div className="mt-10 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl bg-primary-background/80 backdrop-blur border border-border p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-text font-semibold">
                      Your Strong Points
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] border border-border text-text-secondary flex items-center gap-1">
                      <svg
                        className="h-3 w-3 text-white"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M12 2l2.5 5.5L20 10l-5.5 2.5L12 18l-2.5-5.5L4 10l5.5-2.5L12 2z" />
                      </svg>
                      <span>AI</span>
                    </span>
                  </div>
                  {isInsightsLoading && strongPoints.length === 0 ? (
                    <div className="space-y-2">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-10 rounded-lg bg-secondary-background/40 animate-pulse border border-border"
                        />
                      ))}
                    </div>
                  ) : strongPoints.length > 0 ? (
                    <div className="space-y-2">
                      {strongPoints.map((s, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-lg border border-green-500/20 bg-green-500/5"
                        >
                          <div className="mt-0.5 h-5 w-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs">
                            ✓
                          </div>
                          <div className="text-sm text-text-secondary">{s}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-6">
                      <img
                        src={logo}
                        alt="Empty strong points"
                        className="h-12 w-12 opacity-60 mb-3"
                      />
                      <p className="text-sm text-text-secondary">
                        Keep solving exercises to uncover your strengths.
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl bg-primary-background/80 backdrop-blur border border-border p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-text font-semibold">
                      Skills to Strengthen
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] border border-border text-text-secondary flex items-center gap-1">
                      <svg
                        className="h-3 w-3 text-white"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M12 2l2.5 5.5L20 10l-5.5 2.5L12 18l-2.5-5.5L4 10l5.5-2.5L12 2z" />
                      </svg>
                      <span>AI</span>
                    </span>
                  </div>
                  {isInsightsLoading && skillsToImprove.length === 0 ? (
                    <div className="space-y-2">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-10 rounded-lg bg-secondary-background/40 animate-pulse border border-border"
                        />
                      ))}
                    </div>
                  ) : skillsToImprove.length > 0 ? (
                    <div className="space-y-2">
                      {skillsToImprove.map((s, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5"
                        >
                          <div className="mt-0.5 h-5 w-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">
                            ⚠
                          </div>
                          <div className="text-sm text-text-secondary">{s}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-6">
                      <img
                        src={logo}
                        alt="Empty skills to strengthen"
                        className="h-12 w-12 opacity-60 mb-3"
                      />
                      <p className="text-sm text-text-secondary">
                        As you progress, we’ll suggest areas to focus on.
                      </p>
                    </div>
                  )}
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
