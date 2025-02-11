import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3333/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface LearningGoal {
  id: string;
  title: string;
  description?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalData {
  title: string;
  description?: string;
  deadline?: string;
}

const handleApiError = (error: any) => {
  if (error.response) {
    throw new Error(error.response.data.message || 'An error occurred');
  } else if (error.request) {
    throw new Error('No response from server. Please check if the server is running.');
  } else {
    throw new Error('Failed to make request. Please try again.');
  }
};

export const goalsApi = {
  createGoal: async (data: CreateGoalData, token: string) => {
    try {
      const response = await api.post('/goals', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  getGoals: async (token: string) => {
    try {
      const response = await api.get('/goals', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  updateGoalStatus: async (goalId: string, status: LearningGoal['status'], token: string) => {
    try {
      const response = await api.patch(`/goals/${goalId}/status`, { status }, {
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