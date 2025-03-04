import React from 'react';
import { LearningGoal } from '../../api/goals.api';
import { motion } from 'framer-motion';

interface SubjectSidebarProps {
  goals: LearningGoal[];
  isLoading: boolean;
  selectedGoal: LearningGoal | null;
  onSelectGoal: (goal: LearningGoal) => void;
}

export const SubjectSidebar: React.FC<SubjectSidebarProps> = ({
  goals,
  isLoading,
  selectedGoal,
  onSelectGoal,
}) => {
  if (isLoading) {
    return (
      <div className="w-64 bg-secondary-background border-r border-border p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-background rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-secondary-background border-r border-border p-4">
      <h2 className="text-lg font-semibold text-text mb-4">Subjects</h2>
      <div className="space-y-2">
        {goals.map((goal) => (
          <motion.div
            key={goal.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectGoal(goal)}
            className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
              selectedGoal?.id === goal.id
                ? 'bg-primary text-white'
                : 'hover:bg-background text-text-secondary hover:text-text'
            }`}
          >
            <div className="font-medium">{goal.title}</div>
            <div className="text-sm opacity-80 truncate">
              {goal.description || 'No description'}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}; 