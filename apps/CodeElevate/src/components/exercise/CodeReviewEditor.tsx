import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { CodeReviewComment, LogicBlock } from '../../api/exercises.api';
import { codeReviewStyles } from './codeReviewStyles';

interface CodeReviewEditorProps {
  code: string;
  language: string;
  comments: CodeReviewComment[];
  logicBlocks?: LogicBlock[];
}

export const CodeReviewEditor: React.FC<CodeReviewEditorProps> = ({
  code,
  language,
  comments,
  logicBlocks = [],
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
