"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ImprovedImageSelectionOverlay } from "./ImprovedImageSelectionOverlay";

const PREDEFINED_SIZES = [
  { name: "YouTube Thumbnail", width: 1280, height: 720, ratio: "16:9" },
  { name: "YouTube Shorts", width: 1080, height: 1920, ratio: "9:16" },
  { name: "Instagram Post", width: 1080, height: 1080, ratio: "1:1" },
  { name: "Instagram Story", width: 1080, height: 1920, ratio: "9:16" },
  { name: "Facebook Post", width: 1200, height: 630, ratio: "1.91:1" },
  { name: "LinkedIn Post", width: 1200, height: 627, ratio: "1.91:1" },
  { name: "Twitter Post", width: 1200, height: 675, ratio: "16:9" },
  { name: "Square", width: 1080, height: 1080, ratio: "1:1" },
  { name: "Landscape", width: 1920, height: 1080, ratio: "16:9" },
  { name: "Portrait", width: 1080, height: 1920, ratio: "9:16" }
];

interface ImprovedResizeTabProps {
  imagePreview: string;
  imageFile: File;
  onResult: (resultBlob: Blob, format: string, filename: string) => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
}

export function ImprovedResizeTab({ 
  imagePreview, 
  imageFile, 
  onResult, 
  processing, 
  setProcessing 
}: ImprovedResizeTabProps) {
  const [customSize, setCustomSize] = useState({ width: "", height: "" });
  const [selection, setSelection] = useState({ x: 0, y: 0, width: 200, height: 200, zoom: 1 });
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [updateTrigger, setUpdateTrigger] = useState<{ x: number; y: number; width: number; height: number; zoom?: number } | undefined>(undefined);
  const [targetDimensions, setTargetDimensions] = useState<{ width: number; height: number } | undefined>(undefined);

  const handleGenerateFromSelection = async () => {
    if (selection.width === 0 || selection.height === 0) {
      alert('Please select an area first');
      return;
    }

    setProcessing(true);
    try {
      // Create canvas for extraction
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Load the image
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imagePreview;
      });

      // Calculate the actual dimensions based on container size
      const containerElement = document.querySelector('.image-container');
      const containerWidth = containerElement?.clientWidth || 400;
      const containerHeight = containerElement?.clientHeight || 400;
      
      // Calculate scale factors
      const displayScale = Math.min(containerWidth / img.naturalWidth, containerHeight / img.naturalHeight);
      const actualImageWidth = img.naturalWidth * displayScale;
      const actualImageHeight = img.naturalHeight * displayScale;
      
      // Calculate the actual pixel coordinates
      const scaleX = img.naturalWidth / actualImageWidth / selection.zoom;
      const scaleY = img.naturalHeight / actualImageHeight / selection.zoom;
      
      const sourceX = selection.x * scaleX;
      const sourceY = selection.y * scaleY;
      const sourceWidth = selection.width * scaleX;
      const sourceHeight = selection.height * scaleY;

      // Determine final output dimensions
      let outputWidth, outputHeight, filename;
      
      if (targetDimensions) {
        // Use target dimensions for output (e.g., 1080x1080 for Instagram Post)
        outputWidth = targetDimensions.width;
        outputHeight = targetDimensions.height;
        filename = `resized-${outputWidth}x${outputHeight}-${Date.now()}`;
        
        // Set canvas to target size
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        
        // Draw and scale the selected area to fill target dimensions
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, outputWidth, outputHeight
        );
      } else {
        // Use actual selection dimensions for cropping
        outputWidth = Math.round(sourceWidth);
        outputHeight = Math.round(sourceHeight);
        filename = `cropped-${outputWidth}x${outputHeight}-${Date.now()}`;
        
        // Set canvas size to match selection
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        
        // Draw the selected area to canvas at actual size
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, outputWidth, outputHeight
        );
      }

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          onResult(blob, 'png', filename);
        }
        setProcessing(false);
      }, 'image/png');

    } catch (error) {
      console.error('Error generating image from selection:', error);
      alert('Failed to generate image from selection. Please try again.');
      setProcessing(false);
    }
  };

  const handleQuickSizeSelect = useCallback((size: { name: string, width: number, height: number }) => {
    // Calculate aspect ratio
    const aspectRatio = size.width / size.height;
    
    // Set default selection size (larger initial size, more visible)
    let newWidth = 240;
    let newHeight = 240;
    
    if (aspectRatio > 1) {
      // Landscape
      newHeight = newWidth / aspectRatio;
    } else {
      // Portrait or square
      newWidth = newHeight * aspectRatio;
    }
    
    const newSelection = {
      x: selection.x, // Keep current position
      y: selection.y, // Keep current position  
      width: Math.round(newWidth),
      height: Math.round(newHeight),
      zoom: selection.zoom // Keep current zoom
    };
    
    setSelection(newSelection);
    setSelectedSize(size.name);
    setCustomSize({ width: size.width.toString(), height: size.height.toString() });
    setTargetDimensions({ width: size.width, height: size.height });
    
    // Trigger update to the overlay component
    setUpdateTrigger(newSelection);
  }, [selection.x, selection.y, selection.zoom]);

  const getCustomDimensions = () => {
    const width = parseInt(customSize.width);
    const height = parseInt(customSize.height);
    return isNaN(width) || isNaN(height) || width <= 0 || height <= 0 ? null : { width, height };
  };

  // Clear update trigger after a short delay to avoid infinite loops
  useEffect(() => {
    if (updateTrigger) {
      const timer = setTimeout(() => {
        setUpdateTrigger(undefined);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [updateTrigger]);

  return (
    <div className="space-y-4">
      {/* Quick Size Buttons */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Sizes</h3>
        <div className="grid grid-cols-2 gap-2">
          {PREDEFINED_SIZES.map((size) => (
            <button
              key={size.name}
              onClick={() => handleQuickSizeSelect(size)}
              disabled={processing}
              className={cn(
                "p-2 text-xs border rounded-lg transition-all text-left disabled:opacity-50",
                selectedSize === size.name
                  ? "bg-pink-100 text-pink-800 border-pink-200"
                  : "border-gray-200 hover:border-pink-300 hover:bg-pink-50"
              )}
            >
              <div className="font-medium text-gray-900">{size.name}</div>
              <div className="text-gray-500">{size.width}×{size.height}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Custom Size */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Output Size</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-700 mb-1">Width (px)</label>
              <Input
                type="number"
                value={customSize.width}
                onChange={(e) => {
                  setCustomSize(prev => ({ ...prev, width: e.target.value }));
                  setSelectedSize(null);
                  setTargetDimensions(undefined);
                }}
                placeholder="1920"
                className="h-8 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-700 mb-1">Height (px)</label>
              <Input
                type="number"
                value={customSize.height}
                onChange={(e) => {
                  setCustomSize(prev => ({ ...prev, height: e.target.value }));
                  setSelectedSize(null);
                  setTargetDimensions(undefined);
                }}
                placeholder="1080"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Selection: {targetDimensions ? `${targetDimensions.width} × ${targetDimensions.height}` : `${Math.round(selection.width)} × ${Math.round(selection.height)}`} px
          </div>
        </div>
      </Card>

      {/* Image with Selection Overlay */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Select Area & Generate</h3>
        </div>
        <div className="image-container">
          <ImprovedImageSelectionOverlay
            imageUrl={imagePreview}
            onSelectionChange={setSelection}
            initialSelection={selection}
            updateSelection={updateTrigger}
            targetDimensions={targetDimensions}
          />
        </div>
        <div className="mt-4">
          <Button
            onClick={handleGenerateFromSelection}
            disabled={processing || selection.width === 0 || selection.height === 0}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white h-10"
          >
            {processing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating Image...
              </div>
            ) : (
              "Generate Image from Selection"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}