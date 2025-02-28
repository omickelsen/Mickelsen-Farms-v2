import React, { useState, useEffect } from 'react';
import { fetchWithToken } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext'; // Added import

const AdminHorseBoarding = () => {
  const [content, setContent] = useState('Top-notch horse boarding with spacious stalls and daily care.');
  const { token } = useAuth();

  const handleSave = async () => {
    try {
      const response = await fetchWithToken('http://localhost:5000/api/pages/horse-boarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to save content');
      alert('Content saved successfully!');
    } catch (err) {
      console.error('Error saving content:', err);
    }
  };

  return (
    <div>
      <h1>Admin Horse Boarding</h1>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-2 border rounded"
        rows="5"
      />
      <button onClick={handleSave} className="bg-teal-600 text-white p-2 rounded mt-2">
        Save
      </button>
    </div>
  );
};

export default AdminHorseBoarding;