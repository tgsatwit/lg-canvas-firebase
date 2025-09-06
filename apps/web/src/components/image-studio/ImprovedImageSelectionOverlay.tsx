"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ImageSelectionOverlayProps {
  imageUrl: string;
  onSelectionChange: (selection: { x: number; y: number; width: number; height: number; zoom: number }) => void;
  initialSelection?: { x: number; y: number; width: number; height: number; zoom: number };
  updateSelection?: { x: number; y: number; width: number; height: number; zoom?: number };
  targetDimensions?: { width: number; height: number };
  className?: string;
}

export function ImprovedImageSelectionOverlay({ 
  imageUrl, 
  onSelectionChange,
  initialSelection,
  updateSelection,
  targetDimensions,
  className 
}: ImageSelectionOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState(initialSelection || { x: 50, y: 50, width: 300, height: 200 });
  const [zoom, setZoom] = useState(initialSelection?.zoom || 1);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Update parent when selection changes
  useEffect(() => {
    onSelectionChange({ ...selection, zoom });
  }, [selection, zoom, onSelectionChange]);

  // Listen for external selection updates
  useEffect(() => {
    if (updateSelection) {
      setSelection({
        x: updateSelection.x,
        y: updateSelection.y,
        width: updateSelection.width,
        height: updateSelection.height
      });
      if (updateSelection.zoom !== undefined) {
        setZoom(updateSelection.zoom);
      }
    }
  }, [updateSelection]);

  // Load image to get natural dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      
      // Set initial selection to center of image (25% of container size)
      if (containerRef.current) {
        const container = containerRef.current.getBoundingClientRect();
        const initialWidth = container.width * 0.4;
        const initialHeight = container.height * 0.4;
        
        setSelection({
          x: (container.width - initialWidth) / 2,
          y: (container.height - initialHeight) / 2,
          width: initialWidth,
          height: initialHeight
        });
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize', direction?: string) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (action === 'drag') {
      setIsDragging(true);
      setDragStart({ x: x - selection.x, y: y - selection.y });
    } else if (action === 'resize' && direction) {
      setIsResizing(direction);
      setDragStart({ x, y });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isDragging) {
      const newX = x - dragStart.x;
      const newY = y - dragStart.y;
      
      // Constrain within container
      const maxX = rect.width - selection.width;
      const maxY = rect.height - selection.height;
      
      setSelection(prev => ({
        ...prev,
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY))
      }));
    } else if (isResizing) {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      
      setSelection(prev => {
        let newSelection = { ...prev };
        
        switch (isResizing) {
          case 'nw':
            newSelection.x += deltaX;
            newSelection.y += deltaY;
            newSelection.width -= deltaX;
            newSelection.height -= deltaY;
            break;
          case 'ne':
            newSelection.y += deltaY;
            newSelection.width += deltaX;
            newSelection.height -= deltaY;
            break;
          case 'sw':
            newSelection.x += deltaX;
            newSelection.width -= deltaX;
            newSelection.height += deltaY;
            break;
          case 'se':
            newSelection.width += deltaX;
            newSelection.height += deltaY;
            break;
          case 'n':
            newSelection.y += deltaY;
            newSelection.height -= deltaY;
            break;
          case 's':
            newSelection.height += deltaY;
            break;
          case 'w':
            newSelection.x += deltaX;
            newSelection.width -= deltaX;
            break;
          case 'e':
            newSelection.width += deltaX;
            break;
        }
        
        // Constrain minimum size
        newSelection.width = Math.max(50, newSelection.width);
        newSelection.height = Math.max(50, newSelection.height);
        
        // Constrain within container
        newSelection.x = Math.max(0, Math.min(rect.width - newSelection.width, newSelection.x));
        newSelection.y = Math.max(0, Math.min(rect.height - newSelection.height, newSelection.y));
        
        return newSelection;
      });
      
      setDragStart({ x, y });
    }
  }, [isDragging, isResizing, dragStart, selection.width, selection.height]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleZoomChange = (newZoom: number) => {
    setZoom(Math.max(0.5, Math.min(3, newZoom)));
  };

  // Calculate actual dimensions in pixels based on image scaling
  const getActualDimensions = () => {
    // If we have target dimensions from a quick size selection, use those
    if (targetDimensions) {
      return targetDimensions;
    }
    
    // Otherwise calculate based on selection area and image scaling
    if (!containerRef.current || !imageNaturalSize.width) return { width: 0, height: 0 };
    
    const container = containerRef.current.getBoundingClientRect();
    const scaleX = imageNaturalSize.width / container.width * zoom;
    const scaleY = imageNaturalSize.height / container.height * zoom;
    
    return {
      width: Math.round(selection.width * scaleX),
      height: Math.round(selection.height * scaleY)
    };
  };

  const actualDimensions = getActualDimensions();

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
          Selection: {actualDimensions.width}×{actualDimensions.height}px
        </div>
      </div>

      {/* Image with Selection Overlay */}
      <div
        ref={containerRef}
        className="relative w-full h-96 bg-gray-100 rounded-xl overflow-hidden"
        style={{ cursor: isDragging ? 'grabbing' : 'default' }}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Original"
          className="w-full h-full object-contain pointer-events-none"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center'
          }}
          draggable={false}
        />
        
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40 pointer-events-none" />
        
        {/* Selection area */}
        <div
          className="absolute border-2 border-pink-500 bg-transparent"
          style={{
            left: selection.x,
            top: selection.y,
            width: selection.width,
            height: selection.height,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            cursor: 'move'
          }}
          onMouseDown={(e) => handleMouseDown(e, 'drag')}
        >
          {/* Corner resize handles */}
          <div
            className="absolute w-3 h-3 bg-pink-500 rounded-full cursor-nw-resize -top-1.5 -left-1.5"
            onMouseDown={(e) => handleMouseDown(e, 'resize', 'nw')}
          />
          <div
            className="absolute w-3 h-3 bg-pink-500 rounded-full cursor-ne-resize -top-1.5 -right-1.5"
            onMouseDown={(e) => handleMouseDown(e, 'resize', 'ne')}
          />
          <div
            className="absolute w-3 h-3 bg-pink-500 rounded-full cursor-sw-resize -bottom-1.5 -left-1.5"
            onMouseDown={(e) => handleMouseDown(e, 'resize', 'sw')}
          />
          <div
            className="absolute w-3 h-3 bg-pink-500 rounded-full cursor-se-resize -bottom-1.5 -right-1.5"
            onMouseDown={(e) => handleMouseDown(e, 'resize', 'se')}
          />
          
          {/* Edge resize handles */}
          <div
            className="absolute w-full h-1 cursor-n-resize -top-0.5 left-0"
            onMouseDown={(e) => handleMouseDown(e, 'resize', 'n')}
          />
          <div
            className="absolute w-full h-1 cursor-s-resize -bottom-0.5 left-0"
            onMouseDown={(e) => handleMouseDown(e, 'resize', 's')}
          />
          <div
            className="absolute w-1 h-full cursor-w-resize -left-0.5 top-0"
            onMouseDown={(e) => handleMouseDown(e, 'resize', 'w')}
          />
          <div
            className="absolute w-1 h-full cursor-e-resize -right-0.5 top-0"
            onMouseDown={(e) => handleMouseDown(e, 'resize', 'e')}
          />
          
          {/* Selection info */}
          <div className="absolute -top-8 left-0 bg-pink-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {actualDimensions.width}×{actualDimensions.height}px
          </div>
        </div>
      </div>
    </div>
  );
}