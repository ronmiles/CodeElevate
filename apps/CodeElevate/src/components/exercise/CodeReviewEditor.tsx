import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { CodeReviewComment } from '../../api/exercises.api';
import { codeReviewStyles } from './codeReviewStyles';

interface CodeReviewEditorProps {
  code: string;
  language: string;
  comments: CodeReviewComment[];
}

export const CodeReviewEditor: React.FC<CodeReviewEditorProps> = ({
  code,
  language,
  comments,
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

          // Get icon for comment type
          const getIcon = (type: string): string => {
            switch (type) {
              case 'suggestion':
                return '💡';
              case 'error':
                return '❌';
              case 'praise':
                return '🌟';
              default:
                return '📝';
            }
          };

          // Format comment with severity prefix if it exists
          const formatComment = (comment: CodeReviewComment): string => {
            const icon = getIcon(comment.type);
            if (comment.severity) {
              const severityText = comment.severity.toUpperCase();
              return `${icon} [${severityText}] ${comment.comment}`;
            }
            return `${icon} ${comment.comment}`;
          };

          // Get start and end line from lineRange
          const startLine = comment.lineRange[0];
          const endLine = comment.lineRange[1];

          // Create decoration for single-line comment
          if (startLine === endLine) {
            newDecorations.push({
              range: new monacoInstance.Range(startLine, 1, startLine, 1000),
              options: {
                isWholeLine: true,
                className: `review-comment-line review-comment-${comment.type}`,
                glyphMarginClassName: `review-glyph-${comment.type}`,
                glyphMarginHoverMessage: {
                  value: `**${
                    comment.type === 'error'
                      ? 'ERROR'
                      : comment.type === 'suggestion'
                      ? 'SUGGESTION'
                      : 'GOOD PRACTICE'
                  }${
                    comment.severity
                      ? ` (${comment.severity.toUpperCase()})`
                      : ''
                  }**: ${comment.comment}`,
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
                  content: `  // ${formatComment(comment)}`,
                  inlineClassName: `review-inline-comment review-inline-${comment.type}`,
                },
                glyphMargin: true,
                linesDecorationsClassName: `line-decoration-${comment.type}`,
                marginClassName: `margin-decoration-${comment.type}`,
              },
            });
          }
          // Create decoration for multi-line comments
          else {
            // Add decoration to the entire block
            newDecorations.push({
              range: new monacoInstance.Range(startLine, 1, endLine, 1000),
              options: {
                isWholeLine: true,
                className: `review-comment-block review-comment-${comment.type}`,
                hoverMessage: {
                  value: `**${
                    comment.type === 'error'
                      ? 'ERROR'
                      : comment.type === 'suggestion'
                      ? 'SUGGESTION'
                      : 'GOOD PRACTICE'
                  }${
                    comment.severity
                      ? ` (${comment.severity.toUpperCase()})`
                      : ''
                  }**: ${comment.comment}`,
                },
                borderWidth: '1px',
                borderStyle: 'solid',
                borderRadius: '4px',
              },
            });

            // Add the comment indicator at the start of the block
            newDecorations.push({
              range: new monacoInstance.Range(startLine, 1, startLine, 1000),
              options: {
                isWholeLine: true,
                glyphMarginClassName: `review-glyph-${comment.type}`,
                glyphMarginHoverMessage: {
                  value: `**${
                    comment.type === 'error'
                      ? 'ERROR'
                      : comment.type === 'suggestion'
                      ? 'SUGGESTION'
                      : 'GOOD PRACTICE'
                  } (Lines ${startLine}-${endLine})**: ${comment.comment}`,
                },
                glyphMargin: true,
                after: {
                  content: `  // ${formatComment(comment)}`,
                  inlineClassName: `review-inline-comment review-inline-${comment.type}`,
                },
              },
            });
          }
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
  }, [editorInstance, monacoInstance, comments]);

  // Monaco editor setup
  const handleEditorMount = (editor: any, monaco: any) => {
    setEditorInstance(editor);
    setMonacoInstance(monaco);

    // Add CSS styles for comments
    const styleElement = document.createElement('style');
    styleElement.textContent = codeReviewStyles;
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
  );
};

export default CodeReviewEditor;
