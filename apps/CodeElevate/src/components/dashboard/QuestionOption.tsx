import React from 'react';

interface QuestionOptionProps {
  option: string;
  isSelected: boolean;
  onClick: (option: string) => void;
}

export const QuestionOption: React.FC<QuestionOptionProps> = ({
  option,
  isSelected,
  onClick,
}) => {
  return (
    <button
      onClick={() => onClick(option)}
      className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
        isSelected
          ? 'border-primary bg-primary bg-opacity-10 text-primary'
          : 'border-border bg-secondary-background text-text hover:border-primary hover:bg-primary hover:bg-opacity-5'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-white">{option}</span>
        {isSelected && (
          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
    </button>
  );
};
