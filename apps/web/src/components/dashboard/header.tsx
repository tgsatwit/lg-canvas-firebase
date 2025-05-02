import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  heading: string;
  text?: string;
  children?: React.ReactNode;
  className?: string;
}

export function DashboardHeader({
  heading,
  text,
  children,
  className,
}: DashboardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between px-2', className)}>
      <div className="grid gap-1">
        <h1 className="text-2xl font-bold tracking-wide text-slate-900">{heading}</h1>
        {text && <p className="text-neutral-500">{text}</p>}
      </div>
      {children}
    </div>
  );
} 