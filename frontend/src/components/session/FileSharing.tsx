import React, { useState, useRef } from 'react';
import { Upload, File, Download, X, FileText, Image, Video, Music } from 'lucide-react';
import { Button } from '../ui';
import { useToast } from '../../hooks/useToast';
import { formatFileSize } from '../../utils';

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadedBy: string;
  uploadedAt: Date;
}

interface FileSharingProps {
  sessionId: string;
  currentUserId: string;
  currentUserName: string;
  onFileShare?: (file: FileItem) => void;
}

export const FileSharing: React.FC<FileSharingProps> = ({
  sessionId,
  currentUserId,
  currentUserName,
  onFileShare,
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { success: showSuccess, error: showError } = useToast();

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4',
    'video/webm',
    'audio/mp3',
    'audio/wav',
  ];

  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (type.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (type.startsWith('audio/')) return <Music className="h-5 w-5" />;
    if (type === 'application/pdf') return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported';
    }
    if (file.size > maxFileSize) {
      return 'File size exceeds 10MB limit';
    }
    return null;
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      showError(`Some files were rejected: ${errors.join(', ')}`);
    }

    if (validFiles.length > 0) {
      uploadFiles(validFiles);
    }
  };

  const uploadFiles = async (filesToUpload: File[]) => {
    setIsUploading(true);

    try {
      for (const file of filesToUpload) {
        // Create a mock file item (in real implementation, upload to server)
        const fileItem: FileItem = {
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file), // In real app, this would be server URL
          uploadedBy: currentUserName,
          uploadedAt: new Date(),
        };

        setFiles(prev => [...prev, fileItem]);
        onFileShare?.(fileItem);

        // In real implementation, you would upload to server here
        // const formData = new FormData();
        // formData.append('file', file);
        // formData.append('sessionId', sessionId);
        // const response = await apiService.uploadSessionFile(formData);
      }

      showSuccess(`${filesToUpload.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading files:', error);
      showError('Failed to upload files');
    } finally {
      setIsUploading(false);
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const downloadFile = (file: FileItem) => {
    if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess(`Downloaded ${file.name}`);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">File Sharing</h3>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-2">
          Drag and drop files here, or{' '}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-gray-500">
          Supports: Images, PDFs, Documents, Videos, Audio (max 10MB)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-700">Uploading files...</span>
          </div>
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Shared Files</h4>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <div className="text-gray-500 mr-3">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • Shared by {file.uploadedBy} •{' '}
                      {file.uploadedAt.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadFile(file)}
                    className="p-1"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {file.uploadedBy === currentUserName && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && !isUploading && (
        <div className="mt-6 text-center py-8">
          <File className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No files shared yet</p>
          <p className="text-sm text-gray-500">
            Upload files to share with session participants
          </p>
        </div>
      )}
    </div>
  );
};
