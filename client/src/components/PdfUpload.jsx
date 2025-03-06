import React, { useCallback } from 'react';
import { useAuth, fetchWithToken } from '../context/AuthContext';

const PdfUpload = ({ onUpload, page, section }) => {
  const { token, isAdmin } = useAuth();

  const onDrop = useCallback(
    async (event) => {
      const file = event.target.files[0];
      if (!isAdmin || !token) {
        console.log('Upload prevented: Not an admin or no token');
        return;
      }
      if (!file || !file.type.startsWith('application/pdf')) {
        console.log('Invalid file uploaded:', file ? file.type : 'No file');
        return;
      }

      const formData = new FormData();
      formData.append('pdf', file);

      try {
        const baseUrl = process.env.NODE_ENV === 'production'
          ? 'https://mickelsen-family-farms.herokuapp.com'
          : 'http://localhost:5000';
        const response = await fetchWithToken(`${baseUrl}/api/assets/pdfs`, {
          method: 'POST',
          body: formData,
          headers: { 
            'Page': page,
            'Section': section // Pass section in headers
          },
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to upload PDF: ${errorText} (Status: ${response.status})`);
        }
        const data = await response.json();
        console.log('PDF upload successful, response:', data);
        if (onUpload) onUpload(data.url, data.section); // Use section from response
      } catch (err) {
        console.error('PDF upload error:', err.message);
        alert(`PDF upload failed: ${err.message}`);
      }
    },
    [token, isAdmin, onUpload, page, section]
  );

  return isAdmin ? (
    <div className="mt-4">
      <input
        type="file"
        accept="application/pdf"
        onChange={onDrop}
        className="border p-2 rounded"
      />
    </div>
  ) : null;
};

export default PdfUpload;