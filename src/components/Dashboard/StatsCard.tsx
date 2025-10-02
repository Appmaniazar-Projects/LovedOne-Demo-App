import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { useCountUp } from '../../hooks/useCountUp';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  animationDelay?: number;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  color = 'blue',
  animationDelay = 0
}) => {
  // Extract numeric value for animation
  const getNumericValue = (val: string | number): number | null => {
    if (typeof val === 'number') return val;
    // Try to extract number from string (e.g., "R 25,000" or "85%")
    const match = val.toString().replace(/,/g, '').match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  };

  const numericValue = getNumericValue(value);
  const animatedValue = useCountUp(numericValue || 0, 3000, animationDelay);

  // Format the animated value back to the original format
  const displayValue = React.useMemo(() => {
    if (numericValue === null) return value;
    
    const valueStr = value.toString();
    
    // Check if it's a percentage
    if (valueStr.includes('%')) {
      return `${animatedValue}%`;
    }
    
    // Check if it's currency
    if (valueStr.includes('R')) {
      return valueStr.replace(/[\d,]+/, animatedValue.toLocaleString('en-ZA'));
    }
    
    // Default: just return the number
    return animatedValue;
  }, [animatedValue, value, numericValue]);

  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
  };

  const changeClasses = {
    increase: 'text-green-600 dark:text-green-400',
    decrease: 'text-red-600 dark:text-red-400',
    neutral: 'text-slate-600 dark:text-slate-400'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{displayValue}</p>
          {change && (
            <p className={`text-sm mt-2 ${changeClasses[changeType]} flex items-center`}>
              {changeType === 'increase' && (
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
              {changeType === 'decrease' && (
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]} transition-colors duration-200`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;