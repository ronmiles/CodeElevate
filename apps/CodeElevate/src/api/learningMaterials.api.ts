import axios from 'axios';
import { API_URL } from './base';

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface LearningMaterialSection {
  heading: string;
  body: string;
}

export interface CodeExample {
  language: string;
  code: string;
  explanation: string;
}

export interface LearningMaterial {
  id: string;
  checkpointId: string;
  title: string;
  overview: string;
  sections: LearningMaterialSection[];
  estimatedTimeMinutes: number;
  codeExamples?: CodeExample[];
  createdAt: string;
  updatedAt: string;
}

export interface CheckpointWithContent {
  id: string;
  title: string;
  description: string;
  order: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  learningMaterial?: LearningMaterial;
  exercises: any[]; // Use existing Exercise type
  roadmap: {
    goal: {
      id: string;
      title: string;
      description?: string;
      language?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

const handleApiError = (error: any) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || error.message;
    throw new Error(message);
  }
  throw error;
};

export const learningMaterialsApi = {
  getLearningMaterial: async (
    checkpointId: string,
    token: string
  ): Promise<LearningMaterial> => {
    try {
      const response = await api.get(
        `/goals/checkpoints/${checkpointId}/learning-material`,
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

  generateLearningMaterial: async (
    checkpointId: string,
    token: string
  ): Promise<LearningMaterial> => {
    try {
      const response = await api.post(
        `/goals/checkpoints/${checkpointId}/learning-material/generate`,
        {},
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

  getCheckpointWithContent: async (
    checkpointId: string,
    token: string
  ): Promise<CheckpointWithContent> => {
    try {
      const response = await api.get(
        `/goals/checkpoints/${checkpointId}/with-content`,
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

  createLearningMaterial: async (
    checkpointId: string,
    learningMaterial: Omit<
      LearningMaterial,
      'id' | 'checkpointId' | 'createdAt' | 'updatedAt'
    >,
    token: string
  ): Promise<LearningMaterial> => {
    try {
      const response = await api.post(
        '/goals/learning-materials',
        {
          checkpointId,
          learningMaterial,
        },
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

  updateLearningMaterial: async (
    id: string,
    learningMaterial: Partial<
      Omit<LearningMaterial, 'id' | 'checkpointId' | 'createdAt' | 'updatedAt'>
    >,
    token: string
  ): Promise<LearningMaterial> => {
    try {
      const response = await api.put(
        `/goals/learning-materials/${id}`,
        {
          learningMaterial,
        },
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

  deleteLearningMaterial: async (id: string, token: string): Promise<void> => {
    try {
      await api.delete(`/goals/learning-materials/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      handleApiError(error);
    }
  },

  generateCombinedContent: async (
    checkpointId: string,
    token: string
  ): Promise<{
    learningMaterial: LearningMaterial;
    exerciseData: any;
  }> => {
    try {
      const response = await api.post(
        `/goals/checkpoints/${checkpointId}/generate-content`,
        {},
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
};
