import React from 'react';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'text-blue-600',
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div className={clsx(
        'animate-spin rounded-full border-2 border-gray-300 border-t-current',
        sizeClasses[size],
        color
      )} />
    </div>
  );
};

export default LoadingSpinner;