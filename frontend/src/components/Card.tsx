import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => {
  return (
    <div
      className={`bg-card-bg rounded-3xl p-6 shadow-card border border-black/10 dark:border-white/10 transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
};
