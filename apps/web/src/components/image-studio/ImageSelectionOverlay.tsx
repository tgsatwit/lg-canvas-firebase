"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ImageSelectionOverlayProps {
  imageUrl: string;
  selectedSize: { width: number; height: number; ratio: string; name: string } | null;
  onSelectionChange: (selection: { x: number; y: number; width: number; height: number; zoom: number }) => void;
  className?: string;
}

export function ImageSelectionOverlay({ 
  imageUrl, 
  selectedSize, 
  onSelectionChange,
  className 
}: ImageSelectionOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState({ x: 50, y: 50, width: 200, height: 200 });
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Calculate selection dimensions based on selected size ratio
  useEffect(() => {
    if (selectedSize && containerRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      const aspectRatio = selectedSize.width / selectedSize.height;
      
      // Calculate initial selection size (30% of container)
      const baseSize = Math.min(container.width, container.height) * 0.3;
      const newWidth = baseSize;
      const newHeight = baseSize / aspectRatio;
      
      setSelection(prev => ({
        x: (container.width - newWidth) / 2,
        y: (container.height - newHeight) / 2,
        width: newWidth,
        height: newHeight
      }));
    }
  }, [selectedSize]);

  // Notify parent of selection changes
  useEffect(() => {
    onSelectionChange({ ...selection, zoom });
  }, [selection, zoom, onSelectionChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    setDragStart({ x: x - selection.x, y: y - selection.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragStart.x;
    const y = e.clientY - rect.top - dragStart.y;
    
    // Constrain selection within container bounds
    const maxX = rect.width - selection.width;
    const maxY = rect.height - selection.height;
    
    setSelection(prev => ({
      ...prev,
      x: Math.max(0, Math.min(maxX, x)),
      y: Math.max(0, Math.min(maxY, y))
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(Math.max(0.5, Math.min(3, newZoom)));
  };

  if (!selectedSize) {
    return (
      <div className={cn("flex items-center justify-center h-64 bg-gray-100 rounded-xl", className)}>
        <p className="text-gray-500">Select a size format to begin</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Zoom Controls */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Zoom:</span>
          <button
            onClick={() => handleZoomChange(zoom - 0.1)}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg font-bold"
          >
            −
          </button>
          <span className="text-sm text-gray-600 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => handleZoomChange(zoom + 0.1)}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg font-bold"
          >
            +
          </button>
        </div>
        <div className="text-sm text-gray-600">
          Target: {selectedSize.width}×{selectedSize.height}
        </div>
      </div>

      {/* Image with Selection Overlay */}
      <div
        ref={containerRef}
        className="relative w-full h-96 bg-gray-100 rounded-xl overflow-hidden cursor-move"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Original"
          className="w-full h-full object-contain"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center'
          }}
          draggable={false}
        />
        
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        
        {/* Selection area */}
        <div
          className="absolute border-2 border-pink-500 bg-transparent cursor-move"
          style={{
            left: selection.x,
            top: selection.y,
            width: selection.width,
            height: selection.height,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Selection corners */}
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-pink-500 rounded-full"></div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full"></div>
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-pink-500 rounded-full"></div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-pink-500 rounded-full"></div>
          
          {/* Selection info */}
          <div className="absolute -top-8 left-0 bg-pink-500 text-white text-xs px-2 py-1 rounded">
            {selectedSize.name}
          </div>
        </div>
      </div>

      {/* Selection Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="font-medium text-gray-700 mb-1">Current Selection</div>
          <div className="text-gray-600">
            {Math.round(selection.width)}×{Math.round(selection.height)} px
          </div>
        </div>
        <div className="p-3 bg-pink-50 rounded-lg">
          <div className="font-medium text-pink-700 mb-1">Output Size</div>
          <div className="text-pink-600">
            {selectedSize.width}×{selectedSize.height} px
          </div>
        </div>
      </div>
    </div>
  );
}