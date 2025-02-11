import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3333/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Checkpoint {
  id: string;
  title: string;
  description: string;
  order: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

export interface Roadmap {
  id: string;
  goalId: string;
  checkpoints: Checkpoint[];
  createdAt: string;
  updatedAt: string;
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

export const roadmapApi = {
  updateCheckpointStatus: async (
    checkpointId: string,
    status: Checkpoint['status'],
    token: string,
  ) => {
    try {
      const response = await api.patch(
        `/goals/checkpoints/${checkpointId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
}; 