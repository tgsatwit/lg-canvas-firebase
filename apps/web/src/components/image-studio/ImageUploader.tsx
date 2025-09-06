"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ImageUploaderProps {
  onImageSelect: (file: File, preview: string) => void;
  currentPreview?: string | null;
  className?: string;
}

export function ImageUploader({ onImageSelect, currentPreview, className }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const processFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP, etc.)');
      return;
    }

    // Validate file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large. Please select an image smaller than 10MB.');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    
    reader.onload = () => {
      onImageSelect(file, reader.result as string);
      setUploading(false);
    };
    
    reader.onerror = () => {
      alert('Error reading file. Please try again.');
      setUploading(false);
    };
    
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = ''; // Reset input
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      processFile(imageFile);
    } else if (files.length > 0) {
      alert('Please drop an image file (JPG, PNG, WebP, etc.)');
    }
  };

  if (currentPreview) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-50">
          <Image
            src={currentPreview}
            alt="Uploaded image"
            fill
            className="object-contain"
          />
        </div>
        <div className="flex justify-center gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            id="image-replace"
          />
          <label
            htmlFor="image-replace"
            className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
          >
            Replace
          </label>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer",
        isDragging 
          ? "border-pink-500 bg-pink-50" 
          : "border-gray-300 hover:border-pink-300 hover:bg-pink-50/50",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        id="image-upload"
      />
      <label htmlFor="image-upload" className="cursor-pointer">
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600">Loading image...</span>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              {isDragging ? "Drop your image here" : "Choose an image"}
            </p>
            <p className="text-xs text-gray-500">
              {isDragging ? "Release to upload" : "Drag & drop or click • JPG, PNG, WebP"}
            </p>
          </div>
        )}
      </label>
    </div>
  );
}