import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth, fetchWithToken } from '../context/AuthContext';

const ImageUpload = ({ onUpload, page }) => {
  const { token, isAdmin } = useAuth();

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!isAdmin) {
        return;
      }
      const formData = new FormData();
      acceptedFiles.forEach((file) => formData.append('image', file));

      try {
        const response = await fetchWithToken('/api/images', {
          method: 'POST',
          body: formData,
          headers: { 'Page': page || 'default' },
        });
        const data = await response.json();
        if (onUpload) onUpload(data.url);
      } catch (err) {
        // Error handled silently in production
      }
    },
    [token, isAdmin, onUpload, page]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return isAdmin ? (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed p-4 rounded-lg text-center ${
        isDragActive ? 'bg-gray-100' : 'bg-white'
      }`}
    >
      <input {...getInputProps()} />
      <p className="text-gray-600">
        {isDragActive ? 'Drop the files here...' : 'Drag and drop images here, or click to select files'}
      </p>
    </div>
  ) : null;
};

export default ImageUpload;