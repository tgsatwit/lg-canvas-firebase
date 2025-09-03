"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AttachmentFile } from './FileAttachment';
import { FilePickerModal } from './FilePickerModal';

interface FilePickerButtonProps {
  attachments: AttachmentFile[];
  onAttachmentsChange: (attachments: AttachmentFile[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSizePerFile?: number;
  acceptedTypes?: string[];
}

export function FilePickerButton({
  attachments,
  onAttachmentsChange,
  disabled = false,
  maxFiles = 5,
  maxSizePerFile = 10 * 1024 * 1024, // 10MB
  acceptedTypes = [
    'image/*',
    'text/*',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
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
    '.xml',
    '.doc',
    '.docx'
  ]
}: FilePickerButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* File picker button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        className="h-10 w-10 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
        title="Attach files"
      >
        <Plus className="h-4 w-4" />
      </Button>

      {/* File Picker Modal */}
      <FilePickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        attachments={attachments}
        onAttachmentsChange={onAttachmentsChange}
        maxFiles={maxFiles}
        maxSizePerFile={maxSizePerFile}
        acceptedTypes={acceptedTypes}
      />
    </>
  );
}