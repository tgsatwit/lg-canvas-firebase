"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ImageSelectionOverlay } from "./ImageSelectionOverlay";
import { resizeImage, downloadBlob } from "./ImageProcessor";

const PREDEFINED_SIZES = [
  { name: "YouTube Thumbnail", width: 1280, height: 720, ratio: "16:9" },
  { name: "YouTube Shorts", width: 1080, height: 1920, ratio: "9:16" },
  { name: "Instagram Post", width: 1080, height: 1080, ratio: "1:1" },
  { name: "Instagram Story", width: 1080, height: 1920, ratio: "9:16" },
  { name: "Facebook Post", width: 1200, height: 630, ratio: "1.91:1" },
  { name: "LinkedIn Post", width: 1200, height: 627, ratio: "1.91:1" },
  { name: "Twitter Post", width: 1200, height: 675, ratio: "16:9" },
  { name: "Square (1:1)", width: 1080, height: 1080, ratio: "1:1" },
  { name: "Standard (4:3)", width: 1024, height: 768, ratio: "4:3" },
  { name: "Widescreen (16:9)", width: 1920, height: 1080, ratio: "16:9" },
  { name: "Portrait (3:4)", width: 768, height: 1024, ratio: "3:4" },
  { name: "Mobile Banner", width: 640, height: 360, ratio: "16:9" }
];

const IMAGE_FORMATS = [
  { value: "png", label: "PNG (lossless)" },
  { value: "jpeg", label: "JPEG (compressed)" },
  { value: "webp", label: "WebP (modern)" },
  { value: "avif", label: "AVIF (high efficiency)" }
];

interface ResizeTabProps {
  imagePreview: string;
  imageFile: File;
  onResult: (resultBlob: Blob, format: string) => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
}

export function ResizeTab({ imagePreview, imageFile, onResult, processing, setProcessing }: ResizeTabProps) {
  const [selectedSize, setSelectedSize] = useState<typeof PREDEFINED_SIZES[0] | null>(null);
  const [customSize, setCustomSize] = useState({ width: "", height: "" });
  const [useCustomSize, setUseCustomSize] = useState(false);
  const [outputFormat, setOutputFormat] = useState("png");
  const [selection, setSelection] = useState({ x: 0, y: 0, width: 0, height: 0, zoom: 1 });

  const getCurrentSize = () => {
    if (useCustomSize && customSize.width && customSize.height) {
      return {
        name: "Custom",
        width: parseInt(customSize.width),
        height: parseInt(customSize.height),
        ratio: `${customSize.width}:${customSize.height}`
      };
    }
    return selectedSize;
  };

  const handleResizeImage = async () => {
    const currentSize = getCurrentSize();
    if (!currentSize) return;

    setProcessing(true);
    try {
      const resizedBlob = await resizeImage(imageFile, {
        targetWidth: currentSize.width,
        targetHeight: currentSize.height,
        selection: selection,
        format: outputFormat,
        quality: outputFormat === 'jpeg' ? 0.9 : undefined
      });

      onResult(resizedBlob, outputFormat);
    } catch (error) {
      console.error('Error resizing image:', error);
      alert('Failed to resize image. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const isValidCustomSize = useCustomSize && 
    customSize.width && 
    customSize.height && 
    parseInt(customSize.width) > 0 && 
    parseInt(customSize.height) > 0;

  const canResize = (selectedSize && !useCustomSize) || isValidCustomSize;

  return (
    <div className="space-y-6">
      {/* Size Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Predefined Sizes
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {PREDEFINED_SIZES.map((size) => (
            <button
              key={size.name}
              onClick={() => {
                setSelectedSize(size);
                setUseCustomSize(false);
              }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex justify-between items-center",
                selectedSize?.name === size.name && !useCustomSize
                  ? "bg-pink-100 text-pink-800 border border-pink-200"
                  : "border border-gray-200 text-gray-700 hover:border-pink-200 hover:bg-pink-50"
              )}
            >
              <span>{size.name}</span>
              <span className="text-xs text-gray-500">
                {size.width}×{size.height} ({size.ratio})
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Custom Size */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Custom Size
        </h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useCustomSize}
              onChange={(e) => setUseCustomSize(e.target.checked)}
              className="rounded border-gray-300 text-pink-500 focus:ring-pink-500"
            />
            <span className="text-sm font-medium text-gray-700">Use custom dimensions</span>
          </label>
          
          {useCustomSize && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Width (px)</label>
                <input
                  type="number"
                  value={customSize.width}
                  onChange={(e) => setCustomSize(prev => ({ ...prev, width: e.target.value }))}
                  placeholder="e.g. 1920"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height (px)</label>
                <input
                  type="number"
                  value={customSize.height}
                  onChange={(e) => setCustomSize(prev => ({ ...prev, height: e.target.value }))}
                  placeholder="e.g. 1080"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Output Format */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Output Format
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {IMAGE_FORMATS.map((format) => (
            <button
              key={format.value}
              onClick={() => setOutputFormat(format.value)}
              className={cn(
                "px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200",
                outputFormat === format.value
                  ? "bg-pink-100 text-pink-800 border border-pink-200"
                  : "border border-gray-200 text-gray-700 hover:border-pink-200 hover:bg-pink-50"
              )}
            >
              {format.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Image Selection Overlay */}
      {canResize && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Select Area to Resize
          </h3>
          <ImageSelectionOverlay
            imageUrl={imagePreview}
            selectedSize={getCurrentSize()}
            onSelectionChange={setSelection}
          />
        </Card>
      )}

      {/* Resize Action */}
      <Card className="p-6">
        <div className="space-y-4">
          {canResize ? (
            <div className="p-4 bg-pink-50 border border-pink-200 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-pink-800">
                  {getCurrentSize()?.name}
                </span>
                <span className="text-sm text-pink-600">
                  {getCurrentSize()?.ratio}
                </span>
              </div>
              <p className="text-sm text-pink-700">
                Will resize to {getCurrentSize()?.width}×{getCurrentSize()?.height} pixels as {outputFormat.toUpperCase()}
              </p>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <p className="text-sm text-gray-600">
                Select a size format above or enter custom dimensions to begin
              </p>
            </div>
          )}
          
          <Button
            onClick={handleResizeImage}
            disabled={!canResize || processing}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl py-3 font-medium"
          >
            {processing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Resizing Image...
              </div>
            ) : (
              `Resize Image${getCurrentSize() ? ` (${getCurrentSize()?.width}×${getCurrentSize()?.height})` : ''}`
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}