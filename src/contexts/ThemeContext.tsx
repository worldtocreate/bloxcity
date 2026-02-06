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

  // Check if Valentine's Day has arrived (Feb 14, 2026)
  const isValentinesDayOrAfter = () => {
    const now = new Date();
    const valentinesDay = new Date('2026-02-14T00:00:00');
    return now >= valentinesDay;
  };

  // Load theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('bloxcity-theme') as Theme | null;
    const hasVTheme = localStorage.getItem('bloxcity-has-valentines') === 'true';
    
    setHasValentinesTheme(hasVTheme);
    
    // Only allow valentines theme if it's Valentine's Day or after AND user has claimed it
    if (saved === 'valentines' && hasVTheme && isValentinesDayOrAfter()) {
      setThemeState('valentines');
      document.documentElement.classList.add('valentines');
      document.documentElement.classList.remove('dark');
    } else {
      // Force light theme for everyone until Valentine's Day
      setThemeState('light');
      localStorage.setItem('bloxcity-theme', 'light');
      document.documentElement.classList.remove('valentines', 'dark');
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    // Only allow valentines if unlocked AND it's Valentine's Day or after
    if (newTheme === 'valentines') {
      if (!hasValentinesTheme || !isValentinesDayOrAfter()) {
        return;
      }
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
