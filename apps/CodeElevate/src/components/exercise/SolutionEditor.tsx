import React from 'react';
import Editor from '@monaco-editor/react';

interface SolutionEditorProps {
  language: string;
  value: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
}

const SolutionEditor: React.FC<SolutionEditorProps> = ({
  language,
  value,
  onChange,
  readOnly = false,
}) => {
  return (
    <div className="h-[450px] border border-gray-700 rounded-lg overflow-hidden">
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={onChange}
        theme="vs-dark"
        options={{
          readOnly,
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
  );
};

export default SolutionEditor;
