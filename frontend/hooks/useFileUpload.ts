import { useState, useCallback } from "react";
import { uploadFile as apiUploadFile } from "@/lib/upload-api";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  preview?: string;
}

export interface FileUploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  maxFiles?: number;
}

const DEFAULT_OPTIONS: FileUploadOptions = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  maxFiles: 5,
};

export function useFileUpload(options: FileUploadOptions = {}) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = { ...DEFAULT_OPTIONS, ...options };

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > config.maxSize!) {
        return `File size must be less than ${(
          config.maxSize! /
          1024 /
          1024
        ).toFixed(1)}MB`;
      }

      if (config.allowedTypes && !config.allowedTypes.includes(file.type)) {
        return `File type ${file.type} is not supported`;
      }

      return null;
    },
    [config]
  );

  const createPreview = useCallback(
    (file: File): Promise<string | undefined> => {
      return new Promise((resolve) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        } else {
          resolve(undefined);
        }
      });
    },
    []
  );

  const uploadFile = useCallback(
    async (file: File): Promise<UploadedFile | null> => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return null;
      }

      try {
        setUploading(true);
        setError(null);

        // Create preview for images
        const preview = await createPreview(file);

        // Upload to backend using API utility
        const result = await apiUploadFile(file);

        const uploadedFile: UploadedFile = {
          id: result.id || Date.now().toString(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: result.url,
          preview,
        };

        return uploadedFile;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        return null;
      } finally {
        setUploading(false);
      }
    },
    [validateFile, createPreview]
  );

  const addFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);

      if (files.length + fileArray.length > config.maxFiles!) {
        setError(`Maximum ${config.maxFiles} files allowed`);
        return;
      }

      const uploadPromises = fileArray.map(uploadFile);
      const uploadedFiles = await Promise.all(uploadPromises);

      const validFiles = uploadedFiles.filter(
        (file): file is UploadedFile => file !== null
      );
      setFiles((prev) => [...prev, ...validFiles]);
    },
    [files.length, config.maxFiles, uploadFile]
  );

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setError(null);
  }, []);

  return {
    files,
    uploading,
    error,
    addFiles,
    removeFile,
    clearFiles,
    validateFile,
  };
}
