import React from 'react';
import { Dashboard } from './Dashboard';
import { NewDashboard } from './NewDashboard';
import { getIsNewDesign } from '../../utils/featureFlags';

export const DashboardEntry: React.FC = () => {
  const useNew = getIsNewDesign();
  return useNew ? <NewDashboard /> : <Dashboard />;
};

export default DashboardEntry;
