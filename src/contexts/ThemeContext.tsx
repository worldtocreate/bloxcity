import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Force light theme - dark mode disabled for now
  const [theme] = useState<Theme>('light');

  // Always ensure light theme on mount
  useEffect(() => {
    localStorage.setItem('bloxcity-theme', 'light');
    document.documentElement.classList.remove('dark');
  }, []);

  const setTheme = (_newTheme: Theme) => {
    // Disabled - always light theme
  };

  const toggleTheme = () => {
    // Disabled - always light theme
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
