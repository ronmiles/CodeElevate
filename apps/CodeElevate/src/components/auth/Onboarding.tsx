import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../api/auth.api';

const onboardingSchema = z.object({
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  preferredLanguages: z.array(z.string()).min(1, 'Select at least one programming language'),
  learningGoals: z.array(z.string()).min(1, 'Add at least one learning goal'),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const programmingLanguages = [
  'JavaScript',
  'Python',
  'Java',
  'C++',
  'Ruby',
  'Go',
  'Rust',
  'TypeScript',
  'PHP',
  'Swift',
];

export const Onboarding: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      preferredLanguages: [],
      learningGoals: [],
    },
  });

  const selectedLanguages = watch('preferredLanguages');
  const [newGoal, setNewGoal] = useState('');
  const goals = watch('learningGoals');

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      await authApi.onboarding(data, token!);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageToggle = (language: string) => {
    const current = selectedLanguages || [];
    const updated = current.includes(language)
      ? current.filter((l) => l !== language)
      : [...current, language];
    setValue('preferredLanguages', updated);
  };

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      const current = goals || [];
      setValue('learningGoals', [...current, newGoal.trim()]);
      setNewGoal('');
    }
  };

  const handleRemoveGoal = (goal: string) => {
    const current = goals || [];
    setValue('learningGoals', current.filter((g) => g !== goal));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl w-full space-y-8 bg-secondary-background p-8 rounded-2xl shadow-xl border border-border">
        <div className="text-center">
          <h2 className="auth-title">Complete Your Profile</h2>
          <p className="auth-subtitle">
            Help us personalize your learning experience
          </p>
        </div>

        <form className="mt-8 space-y-8" onSubmit={handleSubmit(onSubmit)}>
          {/* Skill Level */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Your Current Skill Level
            </label>
            <select
              {...register('skillLevel')}
              className="auth-input"
            >
              <option value="">Select your skill level</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="EXPERT">Expert</option>
            </select>
            {errors.skillLevel && (
              <p className="auth-error mt-1">{errors.skillLevel.message}</p>
            )}
          </div>

          {/* Programming Languages */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Preferred Programming Languages
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {programmingLanguages.map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => handleLanguageToggle(language)}
                  className={`${
                    selectedLanguages?.includes(language)
                      ? 'bg-primary text-white'
                      : 'bg-background text-text-secondary hover:bg-secondary-background'
                  } px-4 py-2 rounded-lg text-sm font-medium border border-border transition-all duration-200`}
                >
                  {language}
                </button>
              ))}
            </div>
            {errors.preferredLanguages && (
              <p className="auth-error mt-2">
                {errors.preferredLanguages.message}
              </p>
            )}
          </div>

          {/* Learning Goals */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Learning Goals
            </label>
            <div className="mt-2 flex">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                className="auth-input rounded-r-none"
                placeholder="Enter a learning goal"
              />
              <button
                type="button"
                onClick={handleAddGoal}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-r-lg text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
              >
                Add Goal
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {goals?.map((goal) => (
                <div
                  key={goal}
                  className="flex justify-between items-center bg-background px-4 py-3 rounded-lg border border-border"
                >
                  <span className="text-sm text-text">{goal}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveGoal(goal)}
                    className="text-error hover:text-opacity-80 transition-colors duration-200"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            {errors.learningGoals && (
              <p className="auth-error mt-2">
                {errors.learningGoals.message}
              </p>
            )}
          </div>

          {error && (
            <div className="auth-error">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="auth-button"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                'Complete Onboarding'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 