import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  console.log('ThemeProvider rendering');

  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = (savedTheme as Theme) || 'dark';
    console.log('Initial theme from localStorage:', initialTheme);
    return initialTheme;
  });

  useEffect(() => {
    console.log('Theme changed to:', theme);
    localStorage.setItem('theme', theme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  // Apply feature-flagged new dashboard palette at the root (html element)
  useEffect(() => {
    const applyNewDashboardFlag = () => {
      const isNew = localStorage.getItem('dashboard:useNew') === 'true';
      document.documentElement.classList.toggle('new-dashboard', isNew);
    };
    applyNewDashboardFlag();
    window.addEventListener('storage', applyNewDashboardFlag);
    return () => window.removeEventListener('storage', applyNewDashboardFlag);
  }, []);

  const toggleTheme = () => {
    console.log('toggleTheme called, current theme:', theme);
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
      console.log('Setting new theme:', newTheme);
      return newTheme;
    });
  };

  const contextValue = {
    theme,
    toggleTheme,
  };

  console.log('ThemeContext value:', contextValue);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    console.error('useTheme was called outside of ThemeProvider');
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
