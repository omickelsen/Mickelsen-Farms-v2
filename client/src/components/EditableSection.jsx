import React, { useState, useEffect } from 'react';
import { useAuth, fetchWithToken } from '../context/AuthContext';

const EditableSection = ({ page, initialContent, field }) => {
  const { token, isAdmin } = useAuth();
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(
          process.env.NODE_ENV === 'production'
            ? `https://your-heroku-app.herokuapp.com/api/content/${page}`
            : `http://localhost:5000/api/content/${page}`
        );
        if (response.ok) {
          const data = await response.json();
          setContent(data.content[field] || initialContent); // Use server data or fallback to initialContent
          console.log(`Fetched content for ${page}.${field}:`, data.content[field]);
        } else {
          console.warn(`No content found for ${page}.${field}, using initialContent`);
        }
      } catch (err) {
        console.error(`Error fetching content for ${page}:`, err);
      }
    };
    fetchContent();
  }, [page, field]); // Re-fetch if page or field changes

  const handleSave = async () => {
    try {
      const response = await fetchWithToken(
        process.env.NODE_ENV === 'production'
          ? `https://your-heroku-app.herokuapp.com/api/content/${page}`
          : `http://localhost:5000/api/content/${page}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: content }),
        }
      );
      if (!response.ok) throw new Error('Failed to save content');
      setIsEditing(false);
      alert('Content saved successfully!');
    } catch (err) {
      console.error('Error saving content:', err);
      alert('Failed to save content: ' + err.message);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {isEditing ? (
        <>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded mb-2"
            rows="4"
          />
          <button
            onClick={handleSave}
            className="bg-teal-600 text-white p-2 rounded mr-2"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="bg-gray-500 text-white p-2 rounded"
          >
            Cancel
          </button>
        </>
      ) : isAdmin ? (
        <>
          <p className="text-gray-700">{content}</p>
          <button
            onClick={() => setIsEditing(true)}
            className="mt-2 bg-blue-600 text-white p-2 rounded"
          >
            Edit
          </button>
        </>
      ) : (
        <p className="text-gray-700">{content}</p>
      )}
    </div>
  );
};

export default EditableSection;