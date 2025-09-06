"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const QUICK_PROMPTS = [
  "Remove background",
  "Black and white",
  "Enhance quality", 
  "Professional thumbnail",
  "Blur background",
  "Add border",
  "Square crop",
  "Vivid colors"
];

interface CompactAIEditTabProps {
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  onProcessImage: () => void;
  processing: boolean;
}

export function CompactAIEditTab({ 
  customPrompt, 
  setCustomPrompt, 
  onProcessImage, 
  processing 
}: CompactAIEditTabProps) {
  const handlePromptClick = (prompt: string) => {
    setCustomPrompt(prompt);
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handlePromptClick(prompt)}
              className={cn(
                "p-2 text-xs border rounded-lg font-medium transition-all text-left",
                customPrompt === prompt
                  ? "bg-pink-100 text-pink-800 border-pink-200"
                  : "border-gray-200 text-gray-700 hover:border-pink-200 hover:bg-pink-50"
              )}
            >
              {prompt}
            </button>
          ))}
        </div>
      </Card>

      {/* Custom Instructions */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Custom Instructions</h3>
        <div className="space-y-3">
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Describe how you want to edit this image..."
            className="h-20 text-sm resize-none"
          />
          <Button
            onClick={onProcessImage}
            disabled={!customPrompt.trim() || processing}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white h-9"
          >
            {processing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing with AI...
              </div>
            ) : (
              "Transform Image with AI"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}