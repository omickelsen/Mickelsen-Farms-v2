import React, { useCallback } from 'react';
import { useAuth, fetchWithToken } from '../context/AuthContext';

const PdfUpload = ({ onUpload, page }) => {
  const { token, isAdmin } = useAuth();

  const onDrop = useCallback(
    async (event) => {
      const file = event.target.files[0];
      if (!isAdmin || !token) {
        alert('Only admins can upload PDFs.');
        return;
      }
      if (!file || !file.type.startsWith('application/pdf')) {
        alert('Please upload a valid PDF file.');
        return;
      }

      const formData = new FormData();
      formData.append('pdf', file);

      try {
        const response = await fetchWithToken(
          process.env.NODE_ENV === 'production'
            ? 'https://your-heroku-app.herokuapp.com/api/pdfs'
            : 'http://localhost:5000/api/pdfs',
          {
            method: 'POST',
            body: formData,
            headers: { 'Page': page },
          }
        );
        if (!response.ok) throw new Error('Failed to upload PDF');
        const data = await response.json();
        if (onUpload) onUpload(data.url);
      } catch (err) {
        console.error('Error uploading PDF:', err);
        alert('Failed to upload PDF: ' + err.message);
      }
    },
    [token, isAdmin, onUpload, page]
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