import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'valentines';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  hasValentinesTheme: boolean;
  setHasValentinesTheme: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [hasValentinesTheme, setHasValentinesTheme] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('bloxcity-theme') as Theme | null;
    const hasVTheme = localStorage.getItem('bloxcity-has-valentines') === 'true';
    
    setHasValentinesTheme(hasVTheme);
    
    if (saved === 'valentines' && hasVTheme) {
      setThemeState('valentines');
      document.documentElement.classList.add('valentines');
      document.documentElement.classList.remove('dark');
    } else {
      setThemeState('light');
      document.documentElement.classList.remove('valentines', 'dark');
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    // Only allow valentines if unlocked
    if (newTheme === 'valentines' && !hasValentinesTheme) {
      return;
    }
    
    setThemeState(newTheme);
    localStorage.setItem('bloxcity-theme', newTheme);
    
    if (newTheme === 'valentines') {
      document.documentElement.classList.add('valentines');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('valentines', 'dark');
    }
  };

  const updateHasValentinesTheme = (value: boolean) => {
    setHasValentinesTheme(value);
    localStorage.setItem('bloxcity-has-valentines', value ? 'true' : 'false');
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      hasValentinesTheme, 
      setHasValentinesTheme: updateHasValentinesTheme 
    }}>
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
