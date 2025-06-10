'use client';

import * as React from "react";

type ToastVariant = "default" | "destructive";

interface ToastProps {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface Toast extends ToastProps {
  id: string;
}

let toastCount = 0;
const toasters: Toast[] = [];

export function useToast() {
  // Simple implementation without context for now
  const toast = React.useCallback(({ title, description, variant = "default", duration = 5000 }: ToastProps) => {
    const id = (++toastCount).toString();
    console.log(`Toast: ${title || description}`);
    
    // Auto dismiss after duration
    setTimeout(() => {
      console.log(`Toast dismissed: ${id}`);
    }, duration);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    console.log(`Dismiss toast: ${id}`);
  }, []);

  return {
    toast,
    dismiss,
    toasts: toasters
  };
} 