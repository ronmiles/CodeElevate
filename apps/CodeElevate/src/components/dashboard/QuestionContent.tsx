import React from 'react';
import { CustomizationQuestion } from '../../api/goals.api';
import { QuestionInput } from './QuestionInput';

interface QuestionContentProps {
  question: CustomizationQuestion;
  currentValue: string;
  onAnswerChange: (questionId: string, answer: string) => void;
}

export const QuestionContent: React.FC<QuestionContentProps> = ({
  question,
  currentValue,
  onAnswerChange,
}) => {
  return (
    <div className="flex-1 p-6">
      <div className="max-w-2xl mx-auto">
        <h4 className="text-xl font-semibold text-text mb-2">
          {question.question}
        </h4>

        {question.type === 'multiselect' && (
          <p className="text-sm text-text-secondary mb-4">
            Select all that apply
          </p>
        )}

        <QuestionInput
          question={question}
          currentValue={currentValue}
          onAnswerChange={onAnswerChange}
        />
      </div>
    </div>
  );
};
