import React from 'react';

interface DashboardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardContent({
  children,
  className,
}: DashboardContentProps) {
  return (
    <div className={`mt-2 pb-16 ${className || ''}`}>
      {children}
    </div>
  );
} 