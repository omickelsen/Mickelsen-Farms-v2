import React, { useState } from 'react';
import { fetchWithToken } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';

const AdminImageUpload = ({ onImageUpload }) => {
  const { token, isAdmin } = useAuth();
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin || !token || !file) {
      alert('Only admins can upload images or no file selected.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetchWithToken(
        '/api/images',
        {
          method: 'POST',
          body: formData,
          headers: { 'Page': 'carousel' },
        }
      );
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      if (data.url) {
        // Adjust URL to relative path for frontend use
        const relativeUrl = data.url.replace('http://localhost:5000', '');
        onImageUpload(relativeUrl); // Pass the relative URL to the parent
        alert('Image uploaded successfully!');
      } else {
        alert('Upload failed: No valid image URL returned.');
      }
    } catch (err) {
      alert('Failed to upload image: ' + err.message);
    }
  };

  if (!isAdmin) return null;

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="border p-2 rounded"
      />
      <button type="submit" className="mt-2 bg-teal-600 text-white p-2 rounded">
        Upload Image
      </button>
    </form>
  );
};

export default AdminImageUpload;