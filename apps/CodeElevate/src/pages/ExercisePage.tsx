import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  exercisesApi,
  Exercise,
  CodeReviewComment,
  CodeReviewSummary,
} from '../api/exercises.api';
import { useAuth } from '../contexts/AuthContext';
import Editor from '@monaco-editor/react';
import CodeReview from '../components/exercise/CodeReview';
import ReviewSummary from '../components/exercise/ReviewSummary';
import Hints from '../components/exercise/Hints';

export const ExercisePage: React.FC = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
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

  useEffect(() => {
    const fetchExercise = async () => {
      if (!exerciseId || !token) return;

      try {
        setLoading(true);
        const data = await exercisesApi.getExercise(exerciseId, token);
        setExercise(data);

        // Log language information for debugging
        console.log('Exercise language from API:', {
          name: data.language?.name,
          languageId: data.language?.id,
        });

        // Initialize with initial code if available
        if (data.initialCode) {
          setSolution(data.initialCode);
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

      // Update the progress with the code solution
      await exercisesApi.updateProgress(
        exerciseId,
        {
          status: 'IN_PROGRESS',
          code: solution,
        },
        token
      );

      setSubmitStatus('success');
      setStatusMessage('Solution submitted successfully');
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

  // Maps programming language names to Monaco Editor language IDs
  const getMonacoLanguage = (languageName: string): string => {
    if (!languageName) return 'plaintext';

    // Convert to lowercase for case-insensitive matching
    const normalizedName = languageName.toLowerCase();

    // Log the language we're trying to map
    console.log(`Mapping language: "${languageName}"`);

    // Map language names to Monaco editor language IDs
    if (normalizedName.includes('javascript')) return 'javascript';
    if (normalizedName.includes('typescript')) return 'typescript';
    if (normalizedName.includes('python')) return 'python';
    if (
      normalizedName.includes('java') &&
      !normalizedName.includes('javascript')
    )
      return 'java';
    if (normalizedName === 'c') return 'c';
    if (normalizedName.includes('c++') || normalizedName.includes('cpp'))
      return 'cpp';
    if (normalizedName.includes('c#') || normalizedName.includes('csharp'))
      return 'csharp';
    if (normalizedName.includes('go')) return 'go';
    if (normalizedName.includes('ruby')) return 'ruby';
    if (normalizedName.includes('php')) return 'php';
    if (normalizedName.includes('swift')) return 'swift';
    if (normalizedName.includes('kotlin')) return 'kotlin';
    if (normalizedName.includes('rust')) return 'rust';
    if (normalizedName.includes('html')) return 'html';
    if (normalizedName.includes('css')) return 'css';
    if (normalizedName.includes('sql')) return 'sql';

    // Default to plaintext if no match is found
    console.log(
      `No language mapping found for "${languageName}", using plaintext`
    );
    return 'plaintext';
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setSolution(value);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-text-secondary">Loading exercise...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-6xl py-10 px-4">
        <div className="flex flex-col items-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-error mb-2">
              Error Loading Exercise
            </h2>
            <p className="text-text-secondary mb-4">{error}</p>
            <button
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              onClick={() => navigate(-1)}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="container mx-auto max-w-6xl py-10 px-4">
        <div className="flex flex-col items-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-text mb-2">
              Exercise Not Found
            </h2>
            <button
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              onClick={() => navigate(-1)}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 bg-background">
      <div className="flex flex-col gap-8">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-lg shadow-sm border border-gray-700">
          <h1 className="text-2xl font-bold text-text mb-2">
            {exercise.title}
          </h1>
          <div className="flex gap-2 mb-4">
            <span className="px-2 py-1 bg-purple-900 text-purple-100 text-xs font-medium rounded-full">
              {exercise.language.name}
            </span>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                exercise.difficulty === 'EASY'
                  ? 'bg-green-900 text-green-100'
                  : exercise.difficulty === 'MEDIUM'
                  ? 'bg-yellow-900 text-yellow-100'
                  : 'bg-red-900 text-red-100'
              }`}
            >
              {exercise.difficulty}
            </span>
          </div>
          <p className="text-text-secondary mb-2 leading-relaxed">
            {exercise.description}
          </p>
        </div>

        {exercise.hints && exercise.hints.length > 0 && (
          <Hints hints={exercise.hints} />
        )}

        <div className="bg-secondary-background p-6 rounded-lg shadow-sm border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-text flex items-center">
              {showSolution ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-green-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Example Solution
                </>
              ) : showReview ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-purple-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  AI Code Review
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-blue-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Your Solution
                </>
              )}
            </h2>
            <div className="flex gap-3">
              {showSolution ? (
                <button
                  onClick={hideSolution}
                  className="px-4 py-2 bg-gray-700 text-text rounded-lg hover:bg-gray-600 text-sm flex items-center shadow-sm transition-all duration-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                      clipRule="evenodd"
                    />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                  Hide Solution
                </button>
              ) : showReview ? (
                <button
                  onClick={() => setShowReview(false)}
                  className="px-4 py-2 bg-gray-700 text-text rounded-lg hover:bg-gray-600 text-sm flex items-center shadow-sm transition-all duration-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Back to Editor
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSolutionRequest}
                    className="px-4 py-2 bg-indigo-900 text-indigo-100 rounded-lg hover:bg-indigo-800 text-sm flex items-center shadow-sm transition-all duration-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    View Example Solution
                  </button>
                  <button
                    onClick={handleCodeReview}
                    disabled={!solution.trim() || reviewLoading}
                    className={`px-4 py-2 bg-purple-900 text-purple-100 rounded-lg text-sm flex items-center shadow-sm transition-all duration-200 ${
                      !solution.trim() || reviewLoading
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:bg-purple-800'
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Get AI Review
                  </button>
                </>
              )}
            </div>
          </div>

          {showSolution ? (
            <div className="mb-4">
              <div className="p-4 bg-gradient-to-r from-amber-900 to-yellow-900 text-amber-100 rounded-lg mb-4 text-sm flex items-start border border-amber-800">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-medium mb-1">Learning Tip</p>
                  <p>
                    This is the example solution provided by our experts. You
                    can use it as a reference, but we encourage you to try
                    solving the exercise yourself first!
                  </p>
                </div>
              </div>
              <div className="h-[450px] border border-gray-700 rounded-lg overflow-hidden">
                <Editor
                  height="100%"
                  language={getMonacoLanguage(exercise.language.name)}
                  value={
                    exercise.solution ||
                    '// No example solution available for this exercise.'
                  }
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                    automaticLayout: true,
                    renderLineHighlight: 'all',
                    scrollbar: {
                      verticalScrollbarSize: 8,
                      horizontalScrollbarSize: 8,
                    },
                    lineNumbers: 'on',
                    glyphMargin: false,
                    folding: true,
                    lineDecorationsWidth: 10,
                    lineNumbersMinChars: 3,
                  }}
                  beforeMount={(monaco) => {
                    console.log(
                      'Solution editor languages:',
                      monaco.languages.getLanguages().map((l) => l.id)
                    );
                  }}
                  onMount={(editor, monaco) => {
                    console.log(
                      `Mounted solution editor with language: ${getMonacoLanguage(
                        exercise.language.name
                      )}`
                    );
                  }}
                />
              </div>
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
                  language={getMonacoLanguage(exercise.language.name)}
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
              <div className="flex items-center justify-between mb-3">
                <label className="text-text-secondary flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Upload Solution File:
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    accept=".js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.cs,.go,.rb"
                  />
                  <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm flex items-center shadow-sm transition-all duration-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Choose File
                  </button>
                </div>
              </div>

              <div className="h-[450px] border border-gray-700 rounded-lg overflow-hidden">
                <Editor
                  height="100%"
                  language={getMonacoLanguage(exercise.language.name)}
                  value={solution}
                  onChange={handleEditorChange}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                    automaticLayout: true,
                    renderLineHighlight: 'all',
                    scrollbar: {
                      verticalScrollbarSize: 8,
                      horizontalScrollbarSize: 8,
                    },
                    lineNumbers: 'on',
                    glyphMargin: false,
                    folding: true,
                    lineDecorationsWidth: 10,
                    lineNumbersMinChars: 3,
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span
              className={`text-sm ${
                submitStatus === 'error'
                  ? 'text-error'
                  : submitStatus === 'success'
                  ? 'text-green-400'
                  : 'text-text-secondary'
              }`}
            >
              {statusMessage}
            </span>

            {!showSolution && !showReview && (
              <button
                onClick={handleSubmit}
                disabled={submitStatus === 'loading' || !solution.trim()}
                className={`px-4 py-2 bg-primary text-white rounded-lg shadow-sm ${
                  submitStatus === 'loading' || !solution.trim()
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:bg-primary-dark hover:shadow transition-all duration-200'
                } flex items-center`}
              >
                {submitStatus === 'loading' ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Submit Solution
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md mx-4 w-full overflow-hidden transform transition-all border border-gray-700">
            <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-gray-100 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-indigo-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                View Example Solution?
              </h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-text-secondary">
                Are you sure you want to view the solution? We recommend trying
                to solve it yourself first for better learning.
              </p>
            </div>
            <div className="bg-gray-900 px-6 py-3 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmViewSolution}
                className="px-4 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-600"
              >
                Show Solution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExercisePage;
