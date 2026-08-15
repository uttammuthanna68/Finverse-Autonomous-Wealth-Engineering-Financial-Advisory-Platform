import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-3 right-3 sm:top-4 sm:right-6 z-[60] flex items-center space-x-2 px-3 py-2 sm:px-3.5 sm:py-2 rounded-2xl bg-card-bg/85 dark:bg-card-bg/90 border border-primary/20 dark:border-emerald-500/30 text-main shadow-floating backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer"
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
      aria-label="Toggle Theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {theme === 'dark' ? (
          <Moon className="w-4 h-4 text-emerald-400 fill-emerald-400/20 transition-transform duration-300 group-hover:rotate-12" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 fill-amber-400/20 transition-transform duration-300 group-hover:rotate-45" />
        )}
      </div>
      <span className="text-xs font-extrabold hidden xs:inline-block tracking-tight">
        {theme === 'dark' ? 'Dark' : 'Light'}
      </span>
    </button>
  );
};
