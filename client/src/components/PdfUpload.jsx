import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth, fetchWithToken } from '../context/AuthContext';

const PdfUpload = ({ onUpload, page, section }) => {
  const { token, isAdmin } = useAuth();

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!isAdmin) {
        return;
      }

      const formData = new FormData();
      acceptedFiles.forEach((file) => {
        if (file.type.startsWith('application/pdf') || file.name.toLowerCase().endsWith('.pdf')) {
          formData.append('pdfs', file);
        } else {
          console.warn('Skipped file due to invalid type:', file.name);
        }
      });

      try {
        const response = await fetchWithToken('/api/assets/pdfs', {
          method: 'POST',
          body: formData,
          headers: {
            'Page': page || 'default',
            'Section': section || 'default',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to upload PDFs: ${errorText} (Status: ${response.status})`);
        }

        const data = await response.json();
        if (onUpload && data.urls) {
          onUpload(data.urls);
        } else {
          throw new Error('No URLs returned from server');
        }
      } catch (err) {
        console.error('PDF upload error:', err.message);
        alert(`PDF upload failed: ${err.message}`);
      }
    },
    [token, isAdmin, onUpload, page, section]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  return isAdmin ? (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed p-4 rounded-lg text-center mt-4 ${
        isDragActive ? 'bg-gray-100' : 'bg-white'
      }`}
    >
      <input {...getInputProps()} />
      <p className="text-gray-600">
        {isDragActive ? 'Drop the PDFs here...' : 'Drag and drop PDFs here, or click to select files'}
      </p>
    </div>
  ) : null;
};

export default PdfUpload;