import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  title: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  title,
}) => {
  return (
    <div className="p-6 border-b border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-text">{title}</h3>
        <span className="text-sm text-text-secondary">
          {currentStep} of {totalSteps}
        </span>
      </div>
      <div className="w-full bg-background rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{
            width: `${(currentStep / totalSteps) * 100}%`,
          }}
        />
      </div>
    </div>
  );
};
