import React, { useState, useEffect } from 'react';
import {
  CustomizationQuestion,
  CustomizationAnswer,
} from '../../api/goals.api';
import { ProgressBar } from './ProgressBar';
import { QuestionContent } from './QuestionContent';
import { NavigationControls } from './NavigationControls';

interface CustomizationQuestionsProps {
  questions: CustomizationQuestion[];
  onSubmit: (answers: CustomizationAnswer[]) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export const CustomizationQuestions: React.FC<CustomizationQuestionsProps> = ({
  questions,
  onSubmit,
  onBack,
  isLoading = false,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [dynamicQuestions, setDynamicQuestions] = useState<
    CustomizationQuestion[]
  >([]);

  // Initialize dynamic questions from props
  useEffect(() => {
    setDynamicQuestions([...questions]);
  }, [questions]);

  const currentQuestion = dynamicQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === dynamicQuestions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));

    // Check if this is a programming experience question and handle follow-up
    if (
      questionId.includes('experience') ||
      questionId.includes('programming')
    ) {
      const lowerAnswer = answer.toLowerCase();
      if (lowerAnswer === 'yes' || lowerAnswer === 'some') {
        // Add follow-up question about programming languages if not already added
        const hasLanguageQuestion = dynamicQuestions.some(
          (q) =>
            q.id.includes('languages') ||
            q.question.toLowerCase().includes('language')
        );

        if (!hasLanguageQuestion) {
          const languageQuestion: CustomizationQuestion = {
            id: `${questionId}_languages_followup`,
            question:
              'Which programming languages do you have experience with?',
            type: 'multiselect',
            options: [
              'JavaScript',
              'Python',
              'Java',
              'C#',
              'C++',
              'Other (specify in next step)',
            ],
          };

          // Insert the language question right after the current one
          const newQuestions = [...dynamicQuestions];
          newQuestions.splice(currentQuestionIndex + 1, 0, languageQuestion);
          setDynamicQuestions(newQuestions);
        }
      }
    }

    // Handle "Other" selections by adding a text input follow-up
    if (answer.toLowerCase().includes('other')) {
      const hasOtherQuestion = dynamicQuestions.some(
        (q) => q.id === `${questionId}_other_specify`
      );

      if (!hasOtherQuestion) {
        const otherQuestion: CustomizationQuestion = {
          id: `${questionId}_other_specify`,
          question: 'Please specify:',
          type: 'text',
          options: [],
        };

        // Insert the "other" question right after the current one
        const newQuestions = [...dynamicQuestions];
        newQuestions.splice(currentQuestionIndex + 1, 0, otherQuestion);
        setDynamicQuestions(newQuestions);
      }
    }
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Submit the form
      const customizationAnswers: CustomizationAnswer[] = Object.entries(
        answers
      ).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));
      onSubmit(customizationAnswers);
    }
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const canProceed = () => {
    const currentAnswer = answers[currentQuestion.id];
    return Boolean(currentAnswer && currentAnswer.trim() !== '');
  };

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="bg-secondary-background rounded-lg border border-border min-h-[600px] flex flex-col">
      <ProgressBar
        currentStep={currentQuestionIndex + 1}
        totalSteps={dynamicQuestions.length}
        title="Customize Your Learning Experience"
      />

      <QuestionContent
        question={currentQuestion}
        currentValue={answers[currentQuestion.id] || ''}
        onAnswerChange={handleAnswerChange}
      />

      <NavigationControls
        isFirstQuestion={isFirstQuestion}
        isLastQuestion={isLastQuestion}
        canProceed={canProceed()}
        isLoading={isLoading}
        onBack={onBack}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
    </div>
  );
};
