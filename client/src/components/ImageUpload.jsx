import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth, fetchWithToken } from '../context/AuthContext';

const ImageUpload = ({ onUpload, page }) => {
  const { token, isAdmin } = useAuth();

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!isAdmin) {
        console.log('Upload prevented: Not an admin');
        return;
      }

      const formData = new FormData();
      acceptedFiles.forEach((file) => formData.append('image', file));

      try {
        const response = await fetchWithToken('/api/assets/images', {
          method: 'POST',
          body: formData,
          headers: {
            'Page': page || 'default',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to upload image: ${errorText} (Status: ${response.status})`);
        }

        const data = await response.json();
        console.log('Image upload successful, response:', data);
        if (onUpload && data.url) {
          onUpload(data.url); // Pass the full S3 URL to onUpload
        } else {
          throw new Error('No URL returned from server');
        }
      } catch (err) {
        console.error('Image upload error:', err.message);
        alert(`Image upload failed: ${err.message}`); // Notify user of failure
      }
    },
    [token, isAdmin, onUpload, page]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: 'image/*', // Restrict to image files
    multiple: true,   // Allow multiple image uploads
  });

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