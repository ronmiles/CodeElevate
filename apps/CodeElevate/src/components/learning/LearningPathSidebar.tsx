import React from 'react';
import { Checkpoint } from '../../api/roadmap.api';
import { Exercise } from '../../api/exercises.api';
import CheckpointCard from './CheckpointCard';

interface LearningPathSidebarProps {
  checkpoints: Array<{
    id: string;
    title: string;
    description: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    order: number;
    createdAt?: string;
    updatedAt?: string;
  }>;
  checkpointExercisesMap: Record<string, Exercise[]>;
  selectedCheckpointId: string | null;
  onCheckpointClick: (checkpoint: {
    id: string;
    title: string;
    description: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    order: number;
  }) => void;
}

export const LearningPathSidebar: React.FC<LearningPathSidebarProps> = ({
  checkpoints,
  checkpointExercisesMap,
  selectedCheckpointId,
  onCheckpointClick,
}) => {
  return (
    <div
      className="w-80 bg-secondary-background rounded-lg m-3 mr-0 flex-shrink-0 flex flex-col"
      style={{
        height: 'calc(100vh - 100px)',
      }}
    >
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-text">Learning Path</h2>
      </div>

      <div
        className="flex-1 p-4 pt-2 overflow-y-auto"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(75, 85, 99, 0.5) rgba(17, 24, 39, 0.1)',
        }}
      >
        <div className="space-y-2">
          {checkpoints.map((checkpoint) => (
            <CheckpointCard
              key={checkpoint.id}
              checkpoint={checkpoint as Checkpoint}
              exercises={checkpointExercisesMap[checkpoint.id] || []}
              isSelected={selectedCheckpointId === checkpoint.id}
              onClick={() => onCheckpointClick(checkpoint)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LearningPathSidebar;
