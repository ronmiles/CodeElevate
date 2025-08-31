import { api } from './api';

export interface CreateGoalData {
  title: string;
  description?: string;
  deadline?: string;
}

export interface CustomizationQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'multiselect';
  options?: string[];
}

export interface CustomizationAnswer {
  questionId: string;
  answer: string;
}

export interface CreateCustomizedGoalData {
  title: string;
  description?: string;
  deadline?: string;
  customizationAnswers: CustomizationAnswer[];
}

export interface LearningGoal {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  createdAt: string;
  updatedAt: string;
  language?: string;
  roadmap?: {
    id: string;
    checkpoints: Array<{
      id: string;
      title: string;
      description: string;
      status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
      order: number;
    }>;
  };
}

export const goalsApi = {
  async getGoals(token: string): Promise<LearningGoal[]> {
    console.log('Fetching goals with token:', token);
    try {
      const response = await api.get('/goals', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
  },

  async getGoal(goalId: string, token: string): Promise<LearningGoal> {
    console.log('Fetching goal details:', { goalId, token });
    try {
      const response = await api.get(`/goals/${goalId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching goal details:', error);
      throw error;
    }
  },

  async generateCustomizationQuestions(
    title: string,
    description: string | undefined,
    token: string
  ): Promise<CustomizationQuestion[]> {
    try {
      const response = await api.post(
        '/goals/generate-questions',
        { title, description },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating customization questions:', error);
      throw error;
    }
  },

  async createCustomizedGoal(
    data: CreateCustomizedGoalData,
    token: string
  ): Promise<LearningGoal> {
    try {
      const response = await api.post('/goals/create-customized', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating customized goal:', error);
      throw error;
    }
  },

  async createGoal(data: CreateGoalData, token: string): Promise<LearningGoal> {
    try {
      const response = await api.post('/goals', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  },

  async updateGoalStatus(
    goalId: string,
    status: LearningGoal['status'],
    token: string
  ): Promise<LearningGoal> {
    try {
      const response = await api.patch(
        `/goals/${goalId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating goal status:', error);
      throw error;
    }
  },

  async updateCheckpointStatus(
    checkpointId: string,
    status: string,
    token: string
  ): Promise<void> {
    try {
      await api.patch(
        `/goals/checkpoints/${checkpointId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error('Error updating checkpoint status:', error);
      throw error;
    }
  },

  async enhanceDescription(
    title: string,
    description: string | undefined,
    token: string
  ): Promise<string> {
    try {
      const response = await api.post(
        '/goals/enhance-description',
        { title, description },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.description;
    } catch (error) {
      console.error('Error enhancing goal description:', error);
      throw error;
    }
  },
};

export const insightsApi = {
  async getDashboardInsights(token: string): Promise<{
    strongPoints: string[];
    skillsToStrengthen: string[];
  }> {
    const response = await api.get('/insights/dashboard', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};
