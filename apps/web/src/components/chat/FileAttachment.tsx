"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, X, File, Image, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string; // base64 encoded content
  preview?: string; // for images
}

interface FileAttachmentProps {
  attachments: AttachmentFile[];
  onAttachmentsChange: (attachments: AttachmentFile[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSizePerFile?: number; // in bytes
  acceptedTypes?: string[];
}

export function FileAttachment({
  attachments,
  onAttachmentsChange,
  disabled = false,
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
}: FileAttachmentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = async (files: FileList) => {
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
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter(a => a.id !== id));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.includes('text') || type.includes('json') || type.includes('javascript')) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  return (
    <div className="space-y-3">
      {/* Attachment List */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm max-w-xs"
            >
              {attachment.preview ? (
                <img
                  src={attachment.preview}
                  alt={attachment.name}
                  className="w-6 h-6 object-cover rounded"
                />
              ) : (
                getFileIcon(attachment.type)
              )}
              <span className="truncate flex-1" title={attachment.name}>
                {attachment.name}
              </span>
              <span className="text-gray-500 text-xs">
                {formatFileSize(attachment.size)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeAttachment(attachment.id)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Drop Zone & Upload Button */}
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed transition-colors",
          dragActive
            ? "border-pink-500 bg-pink-50"
            : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          disabled={disabled || attachments.length >= maxFiles}
          className="sr-only"
        />
        
        <div className="p-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || attachments.length >= maxFiles}
            className="text-gray-600 hover:text-gray-800"
          >
            <Paperclip className="h-4 w-4 mr-2" />
            Attach files
          </Button>
          
          <p className="text-xs text-gray-500 mt-2">
            Drop files here or click to browse
            <br />
            Max {maxFiles} files, {formatFileSize(maxSizePerFile)} each
          </p>
        </div>
      </div>
    </div>
  );
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