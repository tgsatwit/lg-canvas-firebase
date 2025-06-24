'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

interface DateTimePickerProps {
  date: Date | null;
  setDate: (date: Date | null) => void;
  label?: string;
}

export function DateTimePicker({ date, setDate, label }: DateTimePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      setDate(new Date(value));
    } else {
      setDate(null);
    }
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    // Format as YYYY-MM-DDTHH:mm for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Input
        type="datetime-local"
        value={formatDateForInput(date)}
        onChange={handleChange}
        className="w-full"
      />
      {date && (
        <p className="text-sm text-muted-foreground">
          Selected: {format(date, 'PPpp')}
        </p>
      )}
    </div>
  );
} 