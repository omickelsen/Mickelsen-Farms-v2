import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth, fetchWithToken } from '../context/AuthContext';

const PdfUpload = ({ onUpload, page, section }) => {
  const { token, isAdmin } = useAuth();

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!isAdmin || !token) {
        console.log('Upload prevented: Not an admin or no token');
        return;
      }

      const file = acceptedFiles[0]; // Take the first file
      if (!file || !file.type.startsWith('application/pdf')) {
        console.log('Invalid file uploaded:', file ? file.type : 'No file');
        return;
      }

      const formData = new FormData();
      formData.append('pdf', file); // Matches server-side upload.single('pdf')

      try {
        const response = await fetchWithToken('/api/assets/pdfs', { // Use relative path
          method: 'POST',
          body: formData,
          headers: { 
            'Page': page || 'default',
            'Section': section || 'default', // Pass section in headers
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to upload PDF: ${errorText} (Status: ${response.status})`);
        }

        const data = await response.json();
        console.log('PDF upload successful, response:', data);
        if (onUpload && data.url) {
          onUpload(data.url, data.section); // Pass the S3 URL and section to the parent
        } else {
          throw new Error('No URL returned from server');
        }
      } catch (err) {
        console.error('PDF upload error:', err.message);
        alert(`PDF upload failed: ${err.message}`); // Notify user of failure
      }
    },
    [token, isAdmin, onUpload, page, section]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: 'application/pdf', // Restrict to PDF files
    multiple: false, // Single file upload for simplicity
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
        {isDragActive ? 'Drop the PDF here...' : 'Drag and drop a PDF here, or click to select a file'}
      </p>
    </div>
  ) : null;
};

export default PdfUpload;