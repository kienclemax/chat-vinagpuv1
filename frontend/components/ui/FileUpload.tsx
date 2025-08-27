'use client'

import { useRef, useState } from 'react';
import { 
  PaperClipIcon, 
  XMarkIcon, 
  DocumentIcon,
  PhotoIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { useFileUpload, UploadedFile } from '@/hooks/useFileUpload';

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  className?: string;
}

export default function FileUpload({ 
  onFilesChange, 
  maxFiles = 5,
  className = '' 
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const { 
    files, 
    uploading, 
    error, 
    addFiles, 
    removeFile, 
    clearFiles 
  } = useFileUpload({ maxFiles });

  // Update parent when files change
  React.useEffect(() => {
    onFilesChange(files);
  }, [files, onFilesChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <PhotoIcon className="w-5 h-5" />;
    } else if (type === 'application/pdf') {
      return <DocumentTextIcon className="w-5 h-5" />;
    } else {
      return <DocumentIcon className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-chat-border hover:border-blue-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
        />
        
        <div className="text-center">
          <CloudArrowUpIcon className="mx-auto h-8 w-8 text-chat-text-secondary" />
          <div className="mt-2">
            <p className="text-sm text-chat-text">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Click to upload
              </span>{' '}
              or drag and drop
            </p>
            <p className="text-xs text-chat-text-secondary mt-1">
              Images, PDFs, Documents (max 10MB each)
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          {error}
        </div>
      )}

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-chat-text">
              Uploaded Files ({files.length})
            </h4>
            <button
              onClick={clearFiles}
              className="text-xs text-chat-text-secondary hover:text-red-500"
            >
              Clear all
            </button>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-2 bg-chat-input rounded-lg"
              >
                {/* File Preview/Icon */}
                <div className="flex-shrink-0">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-chat-bg rounded flex items-center justify-center">
                      {getFileIcon(file.type)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-chat-text truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-chat-text-secondary">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(file.id)}
                  className="flex-shrink-0 p-1 text-chat-text-secondary hover:text-red-500 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="text-sm text-chat-text-secondary">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Uploading...
          </div>
        </div>
      )}
    </div>
  );
}
