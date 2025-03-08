import React, { useCallback } from 'react';
import { useAuth, fetchWithToken } from '../context/AuthContext';

const PdfUpload = ({ onUpload, page }) => {
  const { token, isAdmin } = useAuth();

  const onDrop = useCallback(
    async (event) => {
      const file = event.target.files[0];
      if (!isAdmin || !token) {
        return;
      }
      if (!file || !file.type.startsWith('application/pdf')) {
        return;
      }

      const formData = new FormData();
      formData.append('pdf', file);

      try {
        const response = await fetchWithToken('/api/pdfs', {
          method: 'POST',
          body: formData,
          headers: { 'Page': page },
        });
        if (!response.ok) throw new Error('Failed to upload PDF');
        const data = await response.json();
        if (onUpload) onUpload(data.url);
      } catch (err) {
        // Error handled silently in production
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