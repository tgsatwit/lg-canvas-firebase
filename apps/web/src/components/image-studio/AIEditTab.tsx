"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const QUICK_PROMPTS = [
  "Remove the background completely",
  "Make this image black and white with good contrast",
  "Enhance the image quality and make it more vibrant", 
  "Create a professional thumbnail version",
  "Blur the background but keep the subject in focus",
  "Add a subtle artistic border around the image",
  "Crop this to a perfect square focusing on the main subject",
  "Make the colors more vivid and saturated"
];

interface AIEditTabProps {
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  onProcessImage: () => void;
  processing: boolean;
}

export function AIEditTab({ 
  customPrompt, 
  setCustomPrompt, 
  onProcessImage, 
  processing 
}: AIEditTabProps) {
  const handlePromptClick = (prompt: string) => {
    setCustomPrompt(prompt);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="space-y-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handlePromptClick(prompt)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200",
                customPrompt === prompt
                  ? "bg-pink-100 text-pink-800 border border-pink-200"
                  : "border border-gray-200 text-gray-700 hover:border-pink-200 hover:bg-pink-50"
              )}
            >
              {prompt}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Custom Instructions
        </h3>
        <div className="space-y-4">
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Describe how you want to edit this image. Be specific! Examples:
• Remove the person from the background
• Change the sky to a sunset
• Make the subject's hair blonde
• Add a vintage film effect
• Combine this with another artistic style"
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
            rows={6}
          />
          <Button
            onClick={onProcessImage}
            disabled={!customPrompt.trim() || processing}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl py-3 font-medium"
          >
            {processing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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