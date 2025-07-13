import React from 'react';
import { RefreshCw } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading headlines...' 
}) => {
  return (
    <div className="flex items-center justify-center py-8">
      <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mr-2" />
      <span className="text-gray-600">{message}</span>
    </div>
  );
};
