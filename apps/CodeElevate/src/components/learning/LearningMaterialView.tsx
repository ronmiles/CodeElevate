import React from 'react';
import { motion } from 'framer-motion';
import { Clock, BookOpen, Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LearningMaterial, CodeExample } from '../../api/learningMaterials.api';

interface LearningMaterialViewProps {
  learningMaterial: LearningMaterial;
  isLoading?: boolean;
}

const CodeExampleComponent: React.FC<{ example: CodeExample }> = ({
  example,
}) => {
  return (
    <div className="mb-6 border border-border rounded-lg overflow-hidden bg-secondary-background">
      <div className="px-4 py-2 bg-background border-b border-border flex items-center gap-2">
        <Code className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-text">
          {example.language}
        </span>
      </div>
      <div className="p-4">
        <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
          <code>{example.code}</code>
        </pre>
        {example.explanation && (
          <p className="mt-3 text-sm text-text-secondary">
            {example.explanation}
          </p>
        )}
      </div>
    </div>
  );
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="prose prose-sm max-w-none text-text">
      <ReactMarkdown
        components={{
          // Custom styling for code blocks
          code({ children, className, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;

            if (isInline) {
              return (
                <code
                  className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto my-1">
                <code className="font-mono text-sm" {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          // Custom styling for headings
          h1: ({ children }: any) => (
            <h1 className="text-xl font-bold text-text mb-3">{children}</h1>
          ),
          h2: ({ children }: any) => (
            <h2 className="text-lg font-semibold text-text mb-2">{children}</h2>
          ),
          h3: ({ children }: any) => (
            <h3 className="text-base font-semibold text-text mb-2">
              {children}
            </h3>
          ),
          // Custom styling for paragraphs
          p: ({ children }: any) => (
            <p className="text-text mb-3 leading-relaxed">{children}</p>
          ),
          // Custom styling for strong text
          strong: ({ children }: any) => (
            <strong className="font-semibold text-text">{children}</strong>
          ),
          // Custom styling for emphasis
          em: ({ children }: any) => (
            <em className="italic text-text">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export const LearningMaterialView: React.FC<LearningMaterialViewProps> = ({
  learningMaterial,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary-background rounded w-3/4"></div>
          <div className="h-4 bg-secondary-background rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-4 bg-secondary-background rounded"></div>
            <div className="h-4 bg-secondary-background rounded w-5/6"></div>
            <div className="h-4 bg-secondary-background rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <h1 className="text-3xl font-bold text-text">
            {learningMaterial.title}
          </h1>
          <div className="flex items-center gap-2 text-text-secondary">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              {learningMaterial.estimatedTimeMinutes} min read
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-primary">
          <BookOpen className="w-5 h-5" />
          <span className="font-medium">Learning Material</span>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <MarkdownRenderer content={learningMaterial.overview} />
        </div>
      </div>

      {/* Learning Sections */}
      <div className="space-y-6">
        {learningMaterial.sections.map((section, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-secondary-background rounded-lg p-6 border border-border"
          >
            <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              {section.heading}
            </h2>
            <div className="text-text-secondary leading-relaxed">
              <MarkdownRenderer content={section.body} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Code Examples */}
      {learningMaterial.codeExamples &&
        learningMaterial.codeExamples.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-text flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              Code Examples
            </h2>
            {learningMaterial.codeExamples.map((example, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: (learningMaterial.sections.length + index) * 0.1,
                }}
              >
                <CodeExampleComponent example={example} />
              </motion.div>
            ))}
          </div>
        )}

      {/* Ready to Practice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center"
      >
        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
          Ready to Practice! 🚀
        </h3>
        <p className="text-green-700 dark:text-green-300">
          Now that you've learned the concepts, it's time to apply them in the
          exercises.
        </p>
      </motion.div>
    </motion.div>
  );
};
