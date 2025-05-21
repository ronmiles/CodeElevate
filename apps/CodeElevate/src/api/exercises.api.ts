import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3333/api',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Exercise {
  id: string;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  language: {
    id: string;
    name: string;
  };
  goal: {
    id: string;
    title: string;
  };
  checkpoint?: {
    id: string;
    title: string;
    description: string;
  };
  initialCode?: string;
  solution?: string;
  hints: string[];
  testCases?: Record<string, any>;
  progress?: Progress[];
  createdAt: string;
  updatedAt: string;
}

export interface Progress {
  id: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  code?: string;
  attempts: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressStats {
  totalExercises: number;
  completed: number;
  inProgress: number;
  byLanguage: Record<string, { total: number; completed: number }>;
  byDifficulty: Record<string, { total: number; completed: number }>;
}

export interface CodeReviewComment {
  lineRange: [number, number];
  type: 'suggestion' | 'error' | 'praise';
  comment: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface CodeReviewSummary {
  strengths: string;
  improvements: string;
  overallAssessment: string;
}

export interface CodeReviewResponse {
  comments: CodeReviewComment[];
  summary: CodeReviewSummary;
  score: number;
}

export interface ChatMessage {
  message: string;
  code: string;
  reviewComments: CodeReviewComment[];
  reviewSummary?: CodeReviewSummary;
}

export interface ChatResponse {
  response: string;
}

const handleApiError = (error: any) => {
  if (error.response) {
    throw new Error(error.response.data.message || 'An error occurred');
  } else if (error.request) {
    throw new Error(
      'No response from server. Please check if the server is running.'
    );
  } else {
    throw new Error('Failed to make request. Please try again.');
  }
};

export const exercisesApi = {
  async getCheckpointExercises(
    checkpointId: string,
    token: string
  ): Promise<Exercise[]> {
    const response = await api.get(`/exercises/checkpoint/${checkpointId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async generateExercise(
    goalId: string,
    languageId: string,
    checkpointId: string,
    token: string
  ): Promise<Exercise> {
    const response = await api.post(
      '/exercises/generate',
      {
        goalId,
        languageId,
        checkpointId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  getExercises: async (token: string) => {
    try {
      const response = await api.get('/exercises', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  getExercise: async (exerciseId: string, token: string) => {
    try {
      const response = await api.get(`/exercises/${exerciseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  updateProgress: async (
    exerciseId: string,
    data: { status: Progress['status']; code?: string },
    token: string
  ) => {
    try {
      const response = await api.post(
        `/exercises/${exerciseId}/progress`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  getUserProgress: async (token: string) => {
    try {
      const response = await api.get('/exercises/progress', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  reviewCode: async (
    exerciseId: string,
    code: string,
    token: string
  ): Promise<CodeReviewResponse | undefined> => {
    try {
      const response = await api.post(
        `/exercises/${exerciseId}/review`,
        { code },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  sendChatMessage: async (
    exerciseId: string,
    data: ChatMessage,
    token: string
  ): Promise<ChatResponse | undefined> => {
    try {
      const response = await api.post(`/exercises/${exerciseId}/chat`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};
