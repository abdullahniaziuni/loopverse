import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from './Button';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const { theme, toggleTheme } = useTheme();

  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }[size];

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className={`relative overflow-hidden transition-all duration-300 ${className}`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative">
        {/* Sun icon for light mode */}
        <Sun 
          className={`${iconSize} transition-all duration-300 ${
            theme === 'light' 
              ? 'rotate-0 scale-100 opacity-100' 
              : 'rotate-90 scale-0 opacity-0'
          }`}
        />
        
        {/* Moon icon for dark mode */}
        <Moon 
          className={`${iconSize} absolute inset-0 transition-all duration-300 ${
            theme === 'dark' 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
    </Button>
  );
};

// Compact version for mobile/small spaces
export const CompactThemeToggle: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-colors duration-200 ${
        theme === 'light'
          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
      } ${className}`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </button>
  );
};

// Theme toggle with text label
export const LabeledThemeToggle: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
        theme === 'light'
          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
      } ${className}`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <>
          <Moon className="h-4 w-4" />
          <span className="text-sm font-medium">Dark</span>
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" />
          <span className="text-sm font-medium">Light</span>
        </>
      )}
    </button>
  );
};
