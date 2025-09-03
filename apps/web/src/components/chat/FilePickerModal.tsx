"use client";

import { useRef, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { X, Upload, File } from 'lucide-react';
import { AttachmentFile } from './FileAttachment';
import { cn } from '@/lib/utils';

interface FilePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: AttachmentFile[];
  onAttachmentsChange: (attachments: AttachmentFile[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number;
  acceptedTypes?: string[];
}

export function FilePickerModal({
  isOpen,
  onClose,
  attachments,
  onAttachmentsChange,
  maxFiles = 5,
  maxSizePerFile = 10 * 1024 * 1024, // 10MB
  acceptedTypes = [
    'image/*',
    'text/*',
    'application/pdf',
    'application/json',
    'application/javascript',
    'application/typescript',
    '.md',
    '.csv',
    '.txt',
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.py',
    '.java',
    '.cpp',
    '.c',
    '.html',
    '.css',
    '.xml'
  ]
}: FilePickerModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle escape key to close modal and body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    
    return () => {
      // Restore body scroll
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleFiles = useCallback(async (files: FileList) => {
    setIsProcessing(true);
    const newAttachments: AttachmentFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (attachments.length + newAttachments.length >= maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`);
        break;
      }
      
      if (file.size > maxSizePerFile) {
        alert(`File "${file.name}" is too large. Maximum size is ${formatFileSize(maxSizePerFile)}`);
        continue;
      }
      
      try {
        const content = await fileToBase64(file);
        const attachment: AttachmentFile = {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          content,
          preview: file.type.startsWith('image/') ? content : undefined,
        };
        newAttachments.push(attachment);
      } catch (error) {
        console.error(`Failed to process file "${file.name}":`, error);
        alert(`Failed to process file "${file.name}"`);
      }
    }
    
    if (newAttachments.length > 0) {
      onAttachmentsChange([...attachments, ...newAttachments]);
    }
    setIsProcessing(false);
  }, [attachments, onAttachmentsChange, maxFiles, maxSizePerFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const removeAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter(a => a.id !== id));
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Attach Files</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
              isDragOver 
                ? "border-pink-400 bg-pink-50" 
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            )}
          >
            <div className="flex flex-col items-center gap-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(236, 72, 153, 0.1) 0%,
                      rgba(139, 92, 246, 0.1) 100%
                    )
                  `
                }}
              >
                <Upload className="h-8 w-8 text-pink-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {isDragOver ? 'Drop files here' : 'Drag and drop files here'}
                </h3>
                <p className="text-sm text-gray-500">
                  Or click browse to select files
                </p>
              </div>
              
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing || attachments.length >= maxFiles}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                {isProcessing ? 'Processing...' : 'Browse Files'}
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileInput}
            disabled={isProcessing || attachments.length >= maxFiles}
            className="sr-only"
          />

          {/* File Limits */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>Maximum {maxFiles} files • {formatFileSize(maxSizePerFile)} per file</p>
            <p>Supports images, documents, code files, and more</p>
          </div>

          {/* Attached Files */}
          {attachments.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">
                Attached Files ({attachments.length}/{maxFiles})
              </h3>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      {attachment.preview ? (
                        <img
                          src={attachment.preview}
                          alt={attachment.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                          <File className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(attachment.size)}
                      </p>
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(attachment.id)}
                      className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={onClose}
            className="bg-pink-500 hover:bg-pink-600 text-white"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// Utility functions
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}