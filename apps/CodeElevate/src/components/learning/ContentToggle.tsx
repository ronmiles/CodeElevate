import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Code2, CheckCircle2 } from 'lucide-react';

export type ContentType = 'material' | 'exercises';

interface ContentToggleProps {
  activeContent: ContentType;
  onToggle: (content: ContentType) => void;
  hasLearningMaterial: boolean;
  exerciseCount: number;
  completedExercises?: number;
}

export const ContentToggle: React.FC<ContentToggleProps> = ({
  activeContent,
  onToggle,
  hasLearningMaterial,
  exerciseCount,
  completedExercises = 0,
}) => {
  const toggleOptions = [
    {
      type: 'material' as ContentType,
      label: 'Learning Material',
      icon: BookOpen,
      available: true, // Always allow switching
      badge: null,
      hasContent: hasLearningMaterial,
    },
    {
      type: 'exercises' as ContentType,
      label: 'Exercises',
      icon: Code2,
      available: true, // Always allow switching
      badge:
        exerciseCount > 0 ? `${completedExercises}/${exerciseCount}` : null,
      hasContent: exerciseCount > 0,
    },
  ];

  return (
    <div className="flex items-center bg-secondary-background p-1 rounded-lg border border-border mb-6">
      {toggleOptions.map((option) => (
        <button
          key={option.type}
          onClick={() => onToggle(option.type)}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all duration-200
            relative overflow-hidden cursor-pointer
            ${
              activeContent === option.type
                ? 'bg-primary text-white shadow-sm'
                : 'text-text hover:bg-background hover:text-text'
            }
          `}
        >
          {/* Background animation for active state */}
          {activeContent === option.type && (
            <motion.div
              layoutId="activeContentToggle"
              className="absolute inset-0 bg-primary rounded-md"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}

          {/* Content */}
          <div className="relative flex items-center justify-center gap-2">
            <option.icon className="w-4 h-4" />
            <span className="font-medium text-sm">{option.label}</span>

            {/* Badge for exercises count */}
            {option.badge && (
              <span
                className={`
                px-2 py-0.5 rounded-full text-xs font-medium
                ${
                  activeContent === option.type
                    ? 'bg-white/20 text-white'
                    : 'bg-primary/10 text-primary'
                }
              `}
              >
                {option.badge}
                {completedExercises === exerciseCount && exerciseCount > 0 && (
                  <CheckCircle2 className="w-3 h-3 inline ml-1" />
                )}
              </span>
            )}

            {/* Content status indicator */}
            {!option.hasContent && (
              <span className="text-xs opacity-60">(Generate)</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};
