import { useState, useCallback } from 'react';
import { validateFile, sanitizeFilePath, sanitizeHtml } from '../lib/security';

export interface FileUploadState {
  files: File[];
  uploading: boolean;
  results: Array<{
    file: string;
    status: 'success' | 'error';
    message: string;
  }>;
}

export interface FileUploadOptions {
  maxFiles?: number;
  onValidationError?: (errors: string[]) => void;
}

export function useFileUpload(options: FileUploadOptions = {}) {
  const { maxFiles = 10 } = options;
  
  const [state, setState] = useState<FileUploadState>({
    files: [],
    uploading: false,
    results: []
  });

  const validateAndAddFiles = useCallback((selectedFiles: File[]) => {
    if (selectedFiles.length > maxFiles) {
      options.onValidationError?.([`Maximum ${maxFiles} bestanden per keer toegestaan.`]);
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    selectedFiles.forEach(file => {
      const sanitizedName = sanitizeFilePath(file.name);
      if (sanitizedName !== file.name) {
        errors.push(`${file.name}: Bestandsnaam bevat ongeldige karakters`);
        return;
      }

      const validation = validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${sanitizeHtml(file.name)}: ${sanitizeHtml(validation.error || 'Onbekende fout')}`);
      }
    });

    if (errors.length > 0) {
      options.onValidationError?.(errors);
    }

    setState(prev => ({ ...prev, files: [...prev.files, ...validFiles] }));
  }, [maxFiles, options]);

  const removeFile = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  }, []);

  const clearFiles = useCallback(() => {
    setState(prev => ({ ...prev, files: [] }));
  }, []);

  const setUploading = useCallback((uploading: boolean) => {
    setState(prev => ({ ...prev, uploading }));
  }, []);

  const setResults = useCallback((results: FileUploadState['results']) => {
    setState(prev => ({ ...prev, results }));
  }, []);

  return {
    ...state,
    validateAndAddFiles,
    removeFile,
    clearFiles,
    setUploading,
    setResults
  };
}