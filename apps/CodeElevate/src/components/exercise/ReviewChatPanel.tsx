import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiX } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { exercisesApi, CodeReviewComment } from '../../api/exercises.api';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ReviewChatPanelProps {
  exerciseId: string;
  code: string;
  onClose: () => void;
  reviewComments: CodeReviewComment[];
}

const ReviewChatPanel: React.FC<ReviewChatPanelProps> = ({
  exerciseId,
  code,
  onClose,
  reviewComments,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'How can I help you with the code review?',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to clean response text from think tags and other thinking indicators
  const cleanResponseText = (text: string): string => {
    let cleanedText = text;

    // Remove <think> tags and their content
    cleanedText = cleanedText.replace(/<think>[\s\S]*?<\/think>/g, '');

    // Remove any single-line thinking indicators
    cleanedText = cleanedText.replace(
      /^(Thinking:|I need to|Let me think|Let's analyze|My thought process:).*$/gm,
      ''
    );

    // Trim whitespace and remove empty lines at beginning
    cleanedText = cleanedText.trim().replace(/^\s*\n+/g, '');

    return cleanedText;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !token) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call API to get AI response using the exercisesApi
      const data = await exercisesApi.sendChatMessage(
        exerciseId,
        {
          message: userMessage.content,
          code,
          reviewComments,
        },
        token
      );

      if (!data) {
        throw new Error('Failed to get response');
      }

      // Clean the response text before displaying it
      const cleanedResponse = cleanResponseText(data.response);

      // Add AI response
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: cleanedResponse,
        sender: 'assistant',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting chat response:', error);

      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content:
          'Sorry, I was unable to process your request. Please try again.',
        sender: 'assistant',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full border-l border-gray-700 bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="text-lg font-medium text-white">Code Review Chat</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-700 transition-colors"
          aria-label="Close chat panel"
        >
          <FiX className="text-gray-400 hover:text-white" size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.sender === 'user'
                ? 'ml-auto bg-blue-600 text-white'
                : 'mr-auto bg-gray-700 text-gray-100'
            } rounded-lg p-3 max-w-[80%]`}
          >
            {message.sender === 'assistant' ? (
              <div className="markdown-content prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            ) : (
              message.content
            )}
            <div
              className={`text-xs mt-2 ${
                message.sender === 'user' ? 'text-blue-200' : 'text-gray-400'
              }`}
            >
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />

        {isLoading && (
          <div className="flex justify-center my-2">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-700 p-3">
        <div className="flex items-center">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the code review..."
            className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className={`ml-2 p-2 rounded-lg ${
              !input.trim() || isLoading
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } transition-colors`}
            aria-label="Send message"
          >
            <FiSend size={20} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          This chat focuses only on questions about your code and the review.
        </p>
      </div>
    </div>
  );
};

export default ReviewChatPanel;
