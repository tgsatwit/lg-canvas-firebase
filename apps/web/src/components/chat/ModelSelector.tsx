"use client";

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { AI_MODELS } from '@/types/models';

interface ModelSelectorProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export function ModelSelector({ 
  selectedModelId, 
  onModelChange, 
  disabled = false 
}: ModelSelectorProps) {
  const selectedModel = AI_MODELS.find(m => m.id === selectedModelId) || AI_MODELS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="flex items-center gap-2 min-w-[140px] justify-between text-sm"
        >
          <span className="truncate">{selectedModel.name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {AI_MODELS.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => onModelChange(model.id)}
            className={selectedModelId === model.id ? 'bg-gray-100' : ''}
          >
            <div className="w-full">
              <div className="font-medium">{model.name}</div>
              {model.description && (
                <div className="text-xs text-gray-500">{model.description}</div>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}