import React from 'react';
import { useNavigate } from 'react-router-dom';

export const LoadingState: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-text-secondary">Loading exercise...</p>
      </div>
    </div>
  );
};

interface ErrorStateProps {
  error: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error }) => {
  const navigate = useNavigate();

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
};

export const NotFoundState: React.FC = () => {
  const navigate = useNavigate();

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
};
