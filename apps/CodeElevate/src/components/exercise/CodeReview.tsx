import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { CodeReviewComment, LogicBlock } from '../../api/exercises.api';

interface CodeReviewProps {
  code: string;
  language: string;
  comments: CodeReviewComment[];
  logicBlocks?: LogicBlock[];
  isLoading?: boolean;
  error?: string;
}

export const CodeReview: React.FC<CodeReviewProps> = ({
  code,
  language,
  comments,
  logicBlocks = [],
  isLoading = false,
  error,
}) => {
  const [decorations, setDecorations] = useState<any[]>([]);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [monacoInstance, setMonacoInstance] = useState<any>(null);

  useEffect(() => {
    if (editorInstance && monacoInstance) {
      // Create decorations array with proper typing
      const newDecorations: Array<{
        range: any;
        options: any;
      }> = [];

      // Add decorations for specific issues
      if (comments && comments.length > 0) {
        comments.forEach((comment) => {
          // Get a color based on the comment type
          const getColor = (type: string): string => {
            switch (type) {
              case 'suggestion':
                return '#3b82f6'; // blue
              case 'error':
                return '#ef4444'; // red
              case 'praise':
                return '#22c55e'; // green
              default:
                return '#8b5cf6'; // purple
            }
          };

          // Get border width based on severity
          const getBorderWidth = (severity?: string): string => {
            switch (severity) {
              case 'high':
                return '3px';
              case 'medium':
                return '2px';
              default:
                return '1px';
            }
          };

          newDecorations.push({
            range: new monacoInstance.Range(
              comment.line,
              1,
              comment.line,
              1000
            ),
            options: {
              isWholeLine: true,
              className: `review-comment-line review-comment-${comment.type}`,
              glyphMarginClassName: `review-glyph-${comment.type}${
                comment.severity === 'high' ? '-high' : ''
              }`,
              glyphMarginHoverMessage: {
                value: `**${
                  comment.type === 'error'
                    ? 'ERROR'
                    : comment.type === 'suggestion'
                    ? 'SUGGESTION'
                    : 'GOOD PRACTICE'
                }${comment.severity === 'high' ? ' (CRITICAL)' : ''}**: ${
                  comment.comment
                }${
                  comment.type === 'error' && comment.severity === 'high'
                    ? '\n\n⚠️ **This issue requires immediate attention**'
                    : comment.type === 'error'
                    ? '\n\n⚠️ This should be fixed before submission'
                    : comment.type === 'suggestion'
                    ? '\n\n💡 Consider implementing this improvement'
                    : '\n\n✅ Keep up this good practice'
                }`,
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
                  comment.type === 'error'
                    ? '❌ '
                    : comment.type === 'suggestion'
                    ? '💡 '
                    : '✅ '
                }${
                  comment.comment.length > 75
                    ? comment.comment.substring(0, 72) + '...'
                    : comment.comment
                }`,
                inlineClassName: `review-inline-comment review-inline-${comment.type}`,
              },
              glyphMargin: true,
              linesDecorationsClassName: `line-decoration-${comment.type}`,
              marginClassName: `margin-decoration-${comment.type}`,
              // Make error borders thicker based on severity
              lineErrorClassName:
                comment.type === 'error'
                  ? `line-error-severity-${comment.severity || 'medium'}`
                  : '',
            },
          });
        });
      }

      // Add decorations for logic blocks
      if (logicBlocks && logicBlocks.length > 0) {
        logicBlocks.forEach((block) => {
          const startLine = block.lineRange[0];
          const endLine = block.lineRange[1];

          // Determine the border thickness based on severity
          const borderWidth =
            block.type === 'critical'
              ? '3px'
              : block.severity === 'high'
              ? '3px'
              : block.severity === 'medium'
              ? '2px'
              : '1px';

          // Create the class name with severity
          const className = `review-block-${block.type}${
            block.severity ? `-${block.severity}` : ''
          }`;

          // Create hover message with priority indication
          const hoverMessage = {
            value: `**Logic Block${
              block.type === 'critical' ? ' (CRITICAL)' : ''
            }: ${block.description}**\n\n${block.feedback}${
              block.severity === 'high'
                ? '\n\n**High Priority**'
                : block.severity === 'medium'
                ? '\n\n**Medium Priority**'
                : ''
            }`,
          };

          // Create the decoration for the block
          newDecorations.push({
            range: new monacoInstance.Range(startLine, 1, endLine, 1000),
            options: {
              isWholeLine: true,
              className,
              hoverMessage,
              borderWidth,
              borderStyle: 'solid',
              borderRadius: '4px',
            },
          });

          // Add a block indicator at the start of the logic block
          newDecorations.push({
            range: new monacoInstance.Range(startLine, 1, startLine, 1),
            options: {
              isWholeLine: false,
              glyphMarginClassName: `review-block-glyph-${block.type}${
                block.severity === 'high' ? '-high' : ''
              }`,
              glyphMarginHoverMessage: {
                value: `**Logic Block${
                  block.type === 'critical' ? ' (CRITICAL)' : ''
                } (Lines ${startLine}-${endLine}):** ${block.description}\n\n${
                  block.feedback
                }`,
              },
              glyphMargin: true,
            },
          });
        });
      }

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
  }, [editorInstance, monacoInstance, comments, logicBlocks]);

  // Monaco editor setup
  const handleEditorMount = (editor: any, monaco: any) => {
    setEditorInstance(editor);
    setMonacoInstance(monaco);

    // Add CSS styles for comments and logic blocks
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .review-comment-line { background-color: rgba(0, 0, 0, 0.05); }
      .review-comment-suggestion { border-left: 2px solid #3b82f6; }
      .review-comment-error { border-left: 3px solid #ef4444; background-color: rgba(239, 68, 68, 0.05); }
      .review-comment-praise { border-left: 3px solid #22c55e; }
      .review-inline-comment { font-style: italic; opacity: 0.8; }
      .review-inline-suggestion { color: #3b82f6; }
      .review-inline-error { color: #ef4444; }
      .review-inline-praise { color: #22c55e; }
      .review-glyph-suggestion { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%233b82f6' d='M8 1a5 5 0 0 0-5 5v1h1V6a4 4 0 0 1 8 0v1h1V6a5 5 0 0 0-5-5z'/%3E%3Cpath fill='%233b82f6' d='M10 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0z'/%3E%3C/svg%3E") center center no-repeat; }
      .review-glyph-error { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23ef4444'%3E%3Cpath fill-rule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clip-rule='evenodd'/%3E%3C/svg%3E") center center no-repeat; }
      .review-glyph-error-high { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23ef4444'%3E%3Cpath fill-rule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clip-rule='evenodd'/%3E%3C/svg%3E") center center no-repeat; background-color: rgba(239, 68, 68, 0.1); border-radius: 50%; }
      .review-glyph-praise { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%2322c55e' d='M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13z'/%3E%3Cpath fill='%2322c55e' d='M6.5 9.5L5 8l-1 1 2.5 2.5L11 7l-1-1-3.5 3.5z'/%3E%3C/svg%3E") center center no-repeat; }

      /* Logic Block styles */
      .review-block-strength { background-color: rgba(34, 197, 94, 0.07); }
      .review-block-improvement { background-color: rgba(59, 130, 246, 0.07); }
      .review-block-critical { background-color: rgba(239, 68, 68, 0.07); }
      .review-block-critical-high { background-color: rgba(239, 68, 68, 0.12); }

      /* Add new classes for severity levels */
      .review-block-strength-high { background-color: rgba(34, 197, 94, 0.15); box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.3); }
      .review-block-improvement-high { background-color: rgba(59, 130, 246, 0.15); box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3); }
      .review-block-strength-medium { background-color: rgba(34, 197, 94, 0.1); }
      .review-block-improvement-medium { background-color: rgba(59, 130, 246, 0.1); }
      .review-block-critical-medium { background-color: rgba(239, 68, 68, 0.09); }

      .review-block-glyph-strength { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2322c55e'%3E%3Cpath fill-rule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-.08.08-1.53-1.533A5.98 5.98 0 004 10c0 .954.223 1.856.619 2.657l1.54-1.54zm1.088-6.45A5.974 5.974 0 0110 4c.954 0 1.856.223 2.657.619l-1.54 1.54a4.002 4.002 0 00-2.346.033L7.246 4.668zM12 10a2 2 0 11-4 0 2 2 0 014 0z' clip-rule='evenodd'/%3E%3C/svg%3E") center center no-repeat; }
      .review-block-glyph-improvement { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%233b82f6'%3E%3Cpath d='M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z'/%3E%3C/svg%3E") center center no-repeat; }
      .review-block-glyph-critical { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23ef4444'%3E%3Cpath fill-rule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clip-rule='evenodd'/%3E%3C/svg%3E") center center no-repeat; }
      .review-block-glyph-critical-high { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23ef4444'%3E%3Cpath fill-rule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clip-rule='evenodd'/%3E%3C/svg%3E") center center no-repeat; background-color: rgba(239, 68, 68, 0.1); border-radius: 50%; }

      .line-error-severity-high { border-bottom: 2px wavy #ef4444; }
      .line-error-severity-medium { border-bottom: 1px wavy #ef4444; }
      .line-error-severity-low { border-bottom: 1px dotted #ef4444; }
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

      {!isLoading &&
        !error &&
        (comments.length > 0 || logicBlocks.length > 0) && (
          <div className="mb-4 p-3 bg-gray-800 border border-gray-700 rounded-lg text-xs">
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <div className="flex items-center">
                <div className="w-3 h-3 mr-1.5 bg-red-500 rounded-full"></div>
                <span>Error</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 mr-1.5 bg-blue-500 rounded-full"></div>
                <span>Suggestion</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 mr-1.5 bg-green-500 rounded-full"></div>
                <span>Good Practice</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 mr-1.5 bg-indigo-500 opacity-60 rounded-full"></div>
                <span>Logic Block</span>
              </div>
              <div className="ml-auto text-gray-400">
                <span>Hover over icons in the gutter for details</span>
              </div>
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

      {!isLoading &&
        !error &&
        comments.length === 0 &&
        logicBlocks.length === 0 && (
          <div className="mt-4 p-3 bg-gray-800 rounded-lg text-gray-300 text-sm">
            No review comments yet. Submit your code for AI review.
          </div>
        )}
    </div>
  );
};

export default CodeReview;
