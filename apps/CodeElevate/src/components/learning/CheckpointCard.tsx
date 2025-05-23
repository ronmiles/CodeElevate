import React from 'react';
import { motion } from 'framer-motion';
import { Checkpoint } from '../../api/roadmap.api';
import { Exercise } from '../../api/exercises.api';
import { FolderPlus } from 'lucide-react';

interface CheckpointCardProps {
  checkpoint: Checkpoint;
  exercises: Exercise[];
  isSelected: boolean;
  onClick: () => void;
}

export const CheckpointCard: React.FC<CheckpointCardProps> = ({
  checkpoint,
  exercises,
  isSelected,
  onClick,
}) => {
  // Calculate progress
  const getProgress = () => {
    if (exercises.length === 0) return { completed: 0, total: 0, percent: 0 };

    const completed = exercises.filter(
      (ex) =>
        ex.progress &&
        ex.progress.length > 0 &&
        ex.progress[0].grade !== undefined &&
        ex.progress[0].grade >= 70
    ).length;

    return {
      completed,
      total: exercises.length,
      percent: Math.round((completed / exercises.length) * 100),
    };
  };

  const progress = getProgress();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
        isSelected
          ? 'bg-primary text-white'
          : 'hover:bg-background text-text-secondary hover:text-text'
      }`}
    >
      <div className="font-medium">{checkpoint.title}</div>
      <div className="text-sm opacity-80 truncate">
        {checkpoint.description}
      </div>
      <div className="mt-2 flex justify-between items-center">
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            checkpoint.status === 'COMPLETED'
              ? 'bg-green-100 text-green-800'
              : checkpoint.status === 'IN_PROGRESS'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {checkpoint.status.replace('_', ' ')}
        </span>

        {progress.total > 0 && (
          <div className="flex items-center gap-1">
            <FolderPlus className="w-3 h-3 text-gray-500" />
            <span className="text-xs font-medium">
              {progress.completed}/{progress.total}
            </span>
          </div>
        )}
      </div>

      {progress.total > 0 && (
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              progress.percent >= 100
                ? 'bg-gradient-to-r from-green-400 to-green-500'
                : progress.percent > 50
                ? 'bg-gradient-to-r from-blue-400 to-blue-500'
                : progress.percent > 0
                ? 'bg-gradient-to-r from-yellow-300 to-yellow-400'
                : 'bg-gray-500'
            }`}
            style={{ width: `${progress.percent}%` }}
          ></div>
        </div>
      )}
    </motion.div>
  );
};

export default CheckpointCard;
