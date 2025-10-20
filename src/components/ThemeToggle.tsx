import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`px-3 py-2 rounded-lg transition-colors duration-200 hover:${
        isDark ? 'bg-gray-700' : 'bg-[#F0E6D2]'
      } ${className}`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-6 h-6 text-gray-400" />
      ) : (
        <Moon className="w-6 h-6 text-gray-600" />
      )}
    </button>
  );
};
