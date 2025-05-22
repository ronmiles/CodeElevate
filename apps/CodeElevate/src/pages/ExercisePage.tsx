import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  exercisesApi,
  Exercise,
  CodeReviewComment,
  CodeReviewSummary,
} from '../api/exercises.api';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, ChevronRight, ListIcon } from 'lucide-react';

import ExerciseHeader from '../components/exercise/ExerciseHeader';
import SolutionEditor from '../components/exercise/SolutionEditor';
import {
  LoadingState,
  ErrorState,
  NotFoundState,
} from '../components/exercise/ExerciseStates';
import SolutionActions from '../components/exercise/SolutionActions';
import SolutionViewHeader from '../components/exercise/SolutionViewHeader';
import SolutionModal from '../components/exercise/SolutionModal';
import FileUpload from '../components/exercise/FileUpload';
import SolutionInfoMessage from '../components/exercise/SolutionInfoMessage';
import SolutionContainer from '../components/exercise/SolutionContainer';
import { getMonacoLanguage } from '../components/exercise/LanguageUtils';
import CodeReview from '../components/exercise/CodeReview';
import ReviewSummary from '../components/exercise/ReviewSummary';
import Hints from '../components/exercise/Hints';
import GradeDisplay from '../components/exercise/GradeDisplay';
import NavigationButton from '../components/exercise/NavigationButton';

export const ExercisePage: React.FC = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [solution, setSolution] = useState<string>('');
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showSolution, setShowSolution] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reviewComments, setReviewComments] = useState<CodeReviewComment[]>([]);
  const [reviewSummary, setReviewSummary] = useState<CodeReviewSummary | null>(
    null
  );
  const [reviewScore, setReviewScore] = useState<number | undefined>(undefined);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | undefined>(undefined);
  const [showHints, setShowHints] = useState(false);
  const [checkpointExercises, setCheckpointExercises] = useState<Exercise[]>(
    []
  );
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(-1);

  useEffect(() => {
    const fetchExercise = async () => {
      if (!exerciseId || !token) return;

      try {
        setLoading(true);
        const data = await exercisesApi.getExercise(exerciseId, token);
        setExercise(data);

        if (data.progress && data.progress.length > 0) {
          // Set existing solution code if available
          if (data.progress[0].code) {
            setSolution(data.progress[0].code);
          }

          // Set existing grade if available
          if (
            data.progress[0].grade !== undefined &&
            data.progress[0].grade !== null
          ) {
            setReviewScore(data.progress[0].grade);
          }
        } else if (data.initialCode) {
          setSolution(data.initialCode);
        }

        // Fetch all exercises for this checkpoint to enable navigation
        if (data.checkpointId) {
          const checkpointData = await exercisesApi.getCheckpointExercises(
            data.checkpointId,
            token
          );
          setCheckpointExercises(checkpointData);

          // Find the index of the current exercise
          const index = checkpointData.findIndex((e) => e.id === exerciseId);
          setCurrentExerciseIndex(index);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load exercise'
        );
        console.error('Error loading exercise:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExercise();
  }, [exerciseId, token]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setSolution(content);
    };
    reader.onerror = () => {
      setStatusMessage('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!exerciseId || !token || !solution.trim()) return;

    try {
      setSubmitStatus('loading');
      setStatusMessage('Submitting your solution...');

      // If there's no review yet, perform a code review to get a grade
      if (reviewScore === undefined) {
        try {
          setStatusMessage('Generating code review for grading...');
          const reviewResponse = await exercisesApi.reviewCode(
            exerciseId,
            solution,
            token
          );
          if (reviewResponse) {
            setReviewComments(reviewResponse.comments);
            setReviewSummary(reviewResponse.summary);
            setReviewScore(reviewResponse.score);
          }
        } catch (err) {
          console.error('Error generating review for grading:', err);
          // Continue with submission even if review fails
        }
      }

      // Update the progress with the code solution and grade
      await exercisesApi.updateProgress(
        exerciseId,
        {
          status: 'IN_PROGRESS',
          code: solution,
          grade: reviewScore,
        },
        token
      );

      setSubmitStatus('success');
      setStatusMessage('Solution submitted successfully');

      navigate(
        // @ts-expect-error it checkpointId & not checkpoint.id
        `/goal/${exercise.goal.id}/checkpoint/${exercise.checkpointId}`
      );
    } catch (err) {
      setSubmitStatus('error');
      setStatusMessage(
        err instanceof Error ? err.message : 'Failed to submit solution'
      );
      console.error('Error submitting solution:', err);
    }
  };

  const handleSolutionRequest = () => {
    setShowModal(true);
  };

  const confirmViewSolution = () => {
    setShowSolution(true);
    setShowModal(false);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const hideSolution = () => {
    setShowSolution(false);
  };

  const handleCodeReview = async () => {
    if (!exerciseId || !token || !solution.trim()) return;

    try {
      setReviewLoading(true);
      setStatusMessage('Generating code review...');
      setShowReview(true);
      setReviewError(undefined);
      setReviewScore(undefined);

      const reviewResponse = await exercisesApi.reviewCode(
        exerciseId,
        solution,
        token
      );

      if (reviewResponse) {
        setReviewComments(reviewResponse.comments);
        setReviewSummary(reviewResponse.summary);
        setReviewScore(reviewResponse.score);
        setStatusMessage('Code review completed');

        await exercisesApi.updateProgress(
          exerciseId,
          {
            status: 'IN_PROGRESS',
            code: solution,
            grade: reviewResponse.score,
          },
          token
        );
      } else {
        setShowReview(false);
        setStatusMessage('Failed to generate review. Please try again later.');
      }
    } catch (err) {
      // Set review error for the CodeReview component
      let errorMessage = 'Failed to generate code review';

      if (err instanceof Error && err.message) {
        if (err.message.includes('JSON')) {
          errorMessage =
            'AI service returned an invalid response. Please try again later.';
        } else if (err.message.includes('timeout')) {
          errorMessage =
            'Request timed out. The AI service may be overloaded, please try again later.';
        } else if (
          err.message.includes('network') ||
          err.message.includes('connection')
        ) {
          errorMessage =
            'Network error. Please check your connection and try again.';
        } else {
          errorMessage = `Error: ${err.message}`;
        }
      }

      setReviewError(errorMessage);
      setStatusMessage(errorMessage);
      console.error('Error generating code review:', err);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setSolution(value);
    }
  };

  const navigateToPreviousExercise = () => {
    if (currentExerciseIndex > 0 && checkpointExercises.length > 0) {
      navigate(`/exercise/${checkpointExercises[currentExerciseIndex - 1].id}`);
    }
  };

  const navigateToNextExercise = () => {
    if (
      currentExerciseIndex < checkpointExercises.length - 1 &&
      checkpointExercises.length > 0
    ) {
      navigate(`/exercise/${checkpointExercises[currentExerciseIndex + 1].id}`);
    }
  };

  const navigateToCheckpoint = () => {
    if (exercise?.goal?.id && exercise?.checkpointId) {
      navigate(`/goal/${exercise.goal.id}/checkpoint/${exercise.checkpointId}`);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!exercise) {
    return <NotFoundState />;
  }

  const languageId = getMonacoLanguage(exercise.language.name);

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 bg-background relative">
      {/* Navigation Buttons */}
      <NavigationButton
        direction="previous"
        onClick={navigateToPreviousExercise}
        disabled={currentExerciseIndex <= 0}
      />

      <NavigationButton
        direction="next"
        onClick={navigateToNextExercise}
        disabled={currentExerciseIndex >= checkpointExercises.length - 1}
      />

      <div className="flex flex-col gap-8">
        <div className="mb-2">
          <button
            onClick={navigateToCheckpoint}
            className="text-text-secondary hover:text-text flex items-center text-sm mb-4 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Learning Module
          </button>

          <div className="flex justify-between items-center">
            <ExerciseHeader exercise={exercise} />
          </div>
        </div>

        {reviewScore !== undefined && !showSolution && !showReview && (
          <GradeDisplay grade={reviewScore} />
        )}

        <SolutionContainer
          showSolution={showSolution}
          showReview={showReview}
          statusMessage={statusMessage}
          submitStatus={submitStatus}
          reviewLoading={reviewLoading}
          solution={solution}
          onCodeReview={handleCodeReview}
        >
          <SolutionViewHeader
            showSolution={showSolution}
            showReview={showReview}
          >
            <SolutionActions
              showSolution={showSolution}
              showReview={showReview}
              showHints={showHints}
              solution={solution}
              submitStatus={submitStatus}
              reviewLoading={reviewLoading}
              onSolutionRequest={handleSolutionRequest}
              onHintsToggle={() => setShowHints((prev) => !prev)}
              onHideSolution={hideSolution}
              onReviewBack={() => setShowReview(false)}
              onSubmit={handleSubmit}
              onCodeReview={handleCodeReview}
            />
          </SolutionViewHeader>

          {showHints && exercise.hints && exercise.hints.length > 0 && (
            <div className="mb-4">
              <Hints hints={exercise.hints} />
            </div>
          )}

          {showSolution ? (
            <div className="mb-4">
              <SolutionInfoMessage type="example">
                <p>
                  This is the example solution provided by our experts. You can
                  use it as a reference, but we encourage you to try solving the
                  exercise yourself first!
                </p>
              </SolutionInfoMessage>
              <SolutionEditor
                language={languageId}
                value={
                  exercise.solution ||
                  '// No example solution available for this exercise.'
                }
                readOnly={true}
              />
            </div>
          ) : showReview ? (
            <div className="mb-4">
              {!reviewLoading && reviewScore !== undefined && (
                <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700 flex items-center">
                  <div className="mr-6 text-center">
                    <div
                      className={`text-4xl font-bold ${
                        reviewScore >= 90
                          ? 'text-green-400'
                          : reviewScore >= 70
                          ? 'text-yellow-400'
                          : reviewScore >= 50
                          ? 'text-orange-400'
                          : 'text-red-400'
                      }`}
                    >
                      {reviewScore}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">SCORE</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-200 mb-1">
                      Code Assessment
                    </h3>
                    <p className="text-gray-300">
                      {reviewScore >= 90 &&
                        'Excellent work! Your solution demonstrates mastery of the concepts.'}
                      {reviewScore >= 70 &&
                        reviewScore < 90 &&
                        'Good job! Your solution is solid with minor improvements possible.'}
                      {reviewScore >= 50 &&
                        reviewScore < 70 &&
                        'Satisfactory work with some issues to address.'}
                      {reviewScore < 50 &&
                        'Your solution needs significant improvements. Review the feedback carefully.'}
                    </p>
                  </div>
                </div>
              )}
              <div className="h-[450px]">
                <CodeReview
                  exerciseId={exerciseId || ''}
                  code={solution}
                  language={languageId}
                  comments={reviewComments}
                  summary={reviewSummary || undefined}
                  isLoading={reviewLoading}
                  error={reviewError}
                />
              </div>

              {reviewComments.length > 0 &&
                !reviewLoading &&
                !reviewError &&
                reviewSummary && (
                  <div className="mt-10 border-t border-gray-700">
                    <ReviewSummary
                      summary={reviewSummary}
                      comments={reviewComments}
                    />
                  </div>
                )}
            </div>
          ) : (
            <div className="mb-4">
              <FileUpload onUpload={handleFileUpload} />
              <SolutionEditor
                language={languageId}
                value={solution}
                onChange={handleEditorChange}
              />
            </div>
          )}
        </SolutionContainer>
      </div>

      <SolutionModal
        isOpen={showModal}
        onClose={closeModal}
        onConfirm={confirmViewSolution}
      />
    </div>
  );
};

export default ExercisePage;
