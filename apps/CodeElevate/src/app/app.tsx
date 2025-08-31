// Uncomment this line to use CSS modules
// import styles from './app.module.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom';
import { SignIn } from '../components/auth/SignIn';
import { SignUp } from '../components/auth/SignUp';
import { Dashboard } from '../components/dashboard/Dashboard';
import { DashboardEntry } from '../components/dashboard/DashboardEntry';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LearningGoalPage } from '../pages/LearningGoalPage';
import NewGoalPage from '../pages/NewGoalPage';
import ExercisePage from '../pages/ExercisePage';
import AllGoalsPage from '../pages/AllGoalsPage';

const queryClient = new QueryClient();

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/signin" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <DashboardEntry />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/goal/:goalId/checkpoint/:checkpointId"
                  element={
                    <PrivateRoute>
                      <LearningGoalPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/dashboard/new-goal"
                  element={
                    <PrivateRoute>
                      <NewGoalPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/dashboard/goals"
                  element={
                    <PrivateRoute>
                      <AllGoalsPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/exercise/:exerciseId"
                  element={
                    <PrivateRoute>
                      <ExercisePage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
