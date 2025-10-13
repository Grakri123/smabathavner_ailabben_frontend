import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../store/themeStore';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
      style={{
        backgroundColor: isDark ? 'rgb(var(--card))' : 'rgb(var(--card))',
        border: `1px solid rgb(var(--border))`,
        color: 'rgb(var(--foreground))'
      }}
      title={isDark ? 'Bytt til lyst tema' : 'Bytt til mørkt tema'}
      aria-label={isDark ? 'Bytt til lyst tema' : 'Bytt til mørkt tema'}
    >
      <div className="relative w-5 h-5">
        {/* Sun icon for light mode */}
        <Sun 
          size={20} 
          className={`absolute inset-0 transition-all duration-300 ${
            isDark 
              ? 'opacity-0 rotate-90 scale-0' 
              : 'opacity-100 rotate-0 scale-100'
          }`} 
        />
        
        {/* Moon icon for dark mode */}
        <Moon 
          size={20} 
          className={`absolute inset-0 transition-all duration-300 ${
            isDark 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-0'
          }`} 
        />
      </div>
    </button>
  );
};

export default ThemeToggle;
