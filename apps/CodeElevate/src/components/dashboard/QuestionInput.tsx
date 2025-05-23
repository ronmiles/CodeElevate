import React from 'react';
import { CustomizationQuestion } from '../../api/goals.api';
import { QuestionOption } from './QuestionOption';

interface QuestionInputProps {
  question: CustomizationQuestion;
  currentValue: string;
  onAnswerChange: (questionId: string, answer: string) => void;
}

export const QuestionInput: React.FC<QuestionInputProps> = ({
  question,
  currentValue,
  onAnswerChange,
}) => {
  const handleOptionClick = (option: string) => {
    if (question.type === 'select') {
      onAnswerChange(question.id, option);
    } else if (question.type === 'multiselect') {
      const selectedOptions = currentValue ? currentValue.split(',') : [];

      if (selectedOptions.includes(option)) {
        // Remove option
        const newOptions = selectedOptions.filter((opt) => opt !== option);
        onAnswerChange(question.id, newOptions.join(','));
      } else {
        // Add option
        const newOptions = [...selectedOptions, option];
        onAnswerChange(question.id, newOptions.join(','));
      }
    }
  };

  const isOptionSelected = (option: string) => {
    if (question.type === 'select') {
      return currentValue === option;
    } else if (question.type === 'multiselect') {
      const selectedOptions = currentValue ? currentValue.split(',') : [];
      return selectedOptions.includes(option);
    }
    return false;
  };

  switch (question.type) {
    case 'text':
      return (
        <div className="mt-6">
          <textarea
            value={currentValue}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            className="w-full p-4 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-gray-100"
            style={{ color: 'var(--text-color, white)' }}
            rows={4}
            placeholder="Type your answer here..."
          />
          {/* Show current text for debugging */}
          {currentValue && (
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm text-gray-600 dark:text-gray-400">
              Current input: "{currentValue}"
            </div>
          )}
        </div>
      );

    case 'select':
    case 'multiselect':
      return (
        <div className="mt-8 space-y-3">
          {question.options?.map((option, index) => (
            <QuestionOption
              key={index}
              option={option}
              isSelected={isOptionSelected(option)}
              onClick={handleOptionClick}
            />
          ))}
        </div>
      );

    default:
      return null;
  }
};
