import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface SignUpData {
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface OnboardingData {
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  preferredLanguages: string[];
  learningGoals: string[];
}

const handleApiError = (error: any) => {
  if (error.response) {
    // The server responded with a status code outside the 2xx range
    throw new Error(error.response.data.message || 'An error occurred');
  } else if (error.request) {
    // The request was made but no response was received
    throw new Error('No response from server. Please check if the server is running.');
  } else {
    // Something happened in setting up the request
    throw new Error('Failed to make request. Please try again.');
  }
};

export const authApi = {
  signUp: async (data: SignUpData) => {
    try {
      const response = await api.post('/auth/signup', data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  signIn: async (data: SignInData) => {
    try {
      const response = await api.post('/auth/signin', data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  onboarding: async (data: OnboardingData, token: string) => {
    try {
      const response = await api.post('/auth/onboarding', data, {
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
