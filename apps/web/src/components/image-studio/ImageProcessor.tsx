"use client";

// Utility functions for client-side image processing

export interface ResizeOptions {
  targetWidth: number;
  targetHeight: number;
  selection: {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
  };
  format: string;
  quality?: number;
}

export async function resizeImage(
  imageFile: File, 
  options: ResizeOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas size to target dimensions
        canvas.width = options.targetWidth;
        canvas.height = options.targetHeight;

        // Calculate source dimensions based on selection and zoom
        const { selection } = options;
        
        // Apply zoom to the image dimensions
        const zoomedWidth = img.width * selection.zoom;
        const zoomedHeight = img.height * selection.zoom;
        
        // Calculate the actual selection area on the zoomed image
        // The selection coordinates are relative to the display container, 
        // so we need to convert them to the actual image coordinates
        const scaleX = zoomedWidth / (canvas.width);
        const scaleY = zoomedHeight / (canvas.height);
        
        const sourceX = selection.x * scaleX;
        const sourceY = selection.y * scaleY;
        const sourceWidth = selection.width * scaleX;
        const sourceHeight = selection.height * scaleY;

        // Clear canvas with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the selected portion of the image to fit the target dimensions
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,  // Source rectangle
          0, 0, options.targetWidth, options.targetHeight  // Destination rectangle
        );

        // Convert to blob with specified format and quality
        const quality = options.quality || (options.format === 'jpeg' ? 0.9 : undefined);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          `image/${options.format}`,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Load the image
    const url = URL.createObjectURL(imageFile);
    img.src = url;
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}