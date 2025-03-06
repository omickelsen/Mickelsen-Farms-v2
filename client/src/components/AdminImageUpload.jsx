import React from 'react';
import { useAuth } from '../context/AuthContext';

const AdminImageUpload = ({ onImageUpload }) => {
  const { isAdmin } = useAuth();

  if (!isAdmin) return null;

  return (
    <div className="mt-2">
      <input
        type="file"
        accept="image/*"
        onChange={onImageUpload}
        className="border p-2 rounded mr-2"
      />
      <button
        type="button"
        onClick={() => document.querySelector('input[type="file"]').click()}
        className="mt-2 bg-teal-600 text-white p-2 rounded"
      >
        Upload Image
      </button>
    </div>
  );
};

export default AdminImageUpload;