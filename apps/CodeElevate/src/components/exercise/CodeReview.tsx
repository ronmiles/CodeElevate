import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { CodeReviewComment } from '../../api/exercises.api';

interface CodeReviewProps {
  code: string;
  language: string;
  comments: CodeReviewComment[];
  isLoading?: boolean;
  error?: string;
}

export const CodeReview: React.FC<CodeReviewProps> = ({
  code,
  language,
  comments,
  isLoading = false,
  error,
}) => {
  const [decorations, setDecorations] = useState<any[]>([]);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [monacoInstance, setMonacoInstance] = useState<any>(null);

  useEffect(() => {
    if (editorInstance && monacoInstance && comments && comments.length > 0) {
      // Create decorations for each comment
      const newDecorations = comments.map((comment) => {
        // Get a color based on the comment type
        const getColor = (type: string): string => {
          switch (type) {
            case 'suggestion':
              return '#3b82f6'; // blue
            case 'issue':
              return '#ef4444'; // red
            case 'praise':
              return '#22c55e'; // green
            default:
              return '#8b5cf6'; // purple
          }
        };

        // Get an icon based on the comment type
        const getIcon = (type: string): string => {
          switch (type) {
            case 'suggestion':
              return 'lightbulb';
            case 'issue':
              return 'error';
            case 'praise':
              return 'check';
            default:
              return 'info';
          }
        };

        return {
          range: new monacoInstance.Range(comment.line, 1, comment.line, 1000),
          options: {
            isWholeLine: true,
            className: `review-comment-line review-comment-${comment.type}`,
            glyphMarginClassName: `review-glyph-${comment.type}`,
            glyphMarginHoverMessage: {
              value: `**${comment.type.toUpperCase()}**: ${comment.comment}`,
            },
            inlineClassName: `review-inline-${comment.type}`,
            overviewRuler: {
              color: getColor(comment.type),
              position: monacoInstance.editor.OverviewRulerLane.Right,
            },
            minimap: {
              color: getColor(comment.type),
              position: monacoInstance.editor.MinimapPosition.Inline,
            },
            after: {
              content: `  // ${
                comment.comment.length > 80
                  ? comment.comment.substring(0, 77) + '...'
                  : comment.comment
              }`,
              inlineClassName: `review-inline-comment review-inline-${comment.type}`,
            },
            glyphMargin: true,
          },
        };
      });

      // Apply the decorations
      const decorationIds = editorInstance.deltaDecorations([], newDecorations);
      setDecorations(decorationIds);

      // Cleanup function
      return () => {
        if (editorInstance) {
          editorInstance.deltaDecorations(decorationIds, []);
        }
      };
    }
  }, [editorInstance, monacoInstance, comments]);

  // Monaco editor setup
  const handleEditorMount = (editor: any, monaco: any) => {
    setEditorInstance(editor);
    setMonacoInstance(monaco);

    // Add CSS styles for comments
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .review-comment-line { background-color: rgba(0, 0, 0, 0.05); }
      .review-comment-suggestion { border-left: 3px solid #3b82f6; }
      .review-comment-issue { border-left: 3px solid #ef4444; }
      .review-comment-praise { border-left: 3px solid #22c55e; }
      .review-inline-comment { font-style: italic; opacity: 0.8; }
      .review-inline-suggestion { color: #3b82f6; }
      .review-inline-issue { color: #ef4444; }
      .review-inline-praise { color: #22c55e; }
      .review-glyph-suggestion { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%233b82f6' d='M8 1a5 5 0 0 0-5 5v1h1V6a4 4 0 0 1 8 0v1h1V6a5 5 0 0 0-5-5z'/%3E%3Cpath fill='%233b82f6' d='M10 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0z'/%3E%3C/svg%3E") center center no-repeat; }
      .review-glyph-issue { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23ef4444' d='M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13z'/%3E%3Cpath fill='%23ef4444' d='M7.5 4h1v5h-1V4zm0 6h1v1h-1v-1z'/%3E%3C/svg%3E") center center no-repeat; }
      .review-glyph-praise { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%2322c55e' d='M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13z'/%3E%3Cpath fill='%2322c55e' d='M6.5 9.5L5 8l-1 1 2.5 2.5L11 7l-1-1-3.5 3.5z'/%3E%3C/svg%3E") center center no-repeat; }
    `;
    document.head.appendChild(styleElement);

    // Configure the editor
    editor.updateOptions({
      readOnly: true,
      glyphMargin: true,
      lineNumbersMinChars: 3,
      folding: true,
      lineDecorationsWidth: 10,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
    });

    return () => {
      document.head.removeChild(styleElement);
    };
  };

  return (
    <>
      <div className="relative h-full">
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="mt-3 text-sm text-white">
                Generating AI Review...
              </span>
            </div>
          </div>
        )}

        <div className="h-full border border-gray-700 rounded-lg overflow-hidden">
          <Editor
            height="100%"
            language={language}
            value={code}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              fontSize: 14,
              fontFamily: 'Menlo, Monaco, "Courier New", monospace',
              automaticLayout: true,
              renderLineHighlight: 'all',
              scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
            }}
            onMount={handleEditorMount}
          />
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-sm">
            <div className="flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-medium mb-1">Error Generating Review</p>
                <p>{error}</p>
                <p className="mt-2 text-red-300">
                  Please try again or continue working on your solution.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && comments.length === 0 && (
          <div className="mt-4 p-3 bg-gray-800 rounded-lg text-gray-300 text-sm">
            No review comments yet. Submit your code for AI review.
          </div>
        )}
      </div>
    </>
  );
};

export default CodeReview;
