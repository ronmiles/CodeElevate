import React from 'react';
import { Dashboard } from './Dashboard';
import { NewDashboard } from './NewDashboard';

const LS_KEY = 'dashboard:useNew';

export const DashboardEntry: React.FC = () => {
  const useNew =
    typeof window !== 'undefined' && localStorage.getItem(LS_KEY) === 'true';
  return useNew ? <NewDashboard /> : <Dashboard />;
};

export default DashboardEntry;
