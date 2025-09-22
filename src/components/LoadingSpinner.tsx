import React from 'react';
import { Loader2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'card' | 'fullscreen';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'md',
  variant = 'default',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const SpinnerContent = () => (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="relative">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></div>
        </div>
      </div>
      {message && (
        <div className="text-center space-y-1">
          <p className={`${textSizeClasses[size]} font-medium text-gray-900`}>
            {message}
          </p>
          <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Please wait...</span>
          </div>
        </div>
      )}
      
      {/* Loading animation dots */}
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: '0.6s'
            }}
          />
        ))}
      </div>
    </div>
  );

  if (variant === 'fullscreen') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="p-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <SpinnerContent />
        </Card>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className="p-6 border-0 shadow-md bg-white/80 backdrop-blur-sm">
        <SpinnerContent />
      </Card>
    );
  }

  return <SpinnerContent />;
};
