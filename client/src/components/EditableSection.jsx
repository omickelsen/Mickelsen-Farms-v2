import React, { useState, useEffect } from 'react';
import { useAuth, fetchWithToken } from '../context/AuthContext';

const EditableSection = ({ page, initialContent, field }) => {
  const { token, isAdmin } = useAuth() || {};
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // State for error messages
  const [success, setSuccess] = useState(null); // State for success messages

  // Load content on mount
  useEffect(() => {
    const cachedContent = localStorage.getItem(`content_${page}_${field}`);
    if (cachedContent) {
      const parsedContent = JSON.parse(cachedContent);
      setContent(parsedContent);
    }
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/content/${page}`); // Relative path for proxy
        if (response.ok) {
          const data = await response.json();
          const newContent = data.content?.content?.[field] || initialContent; // Handle nested content
          setContent(newContent);
          localStorage.setItem(`content_${page}_${field}`, JSON.stringify(newContent));
        } else if (!cachedContent) {
          setContent(initialContent);
        }
      } catch (err) {
        if (!cachedContent) setContent(initialContent);
        setError('Failed to fetch content.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [page, field, initialContent]);

  // Handle save
  const handleSave = async () => {
    if (!isAdmin || !token) {
      localStorage.setItem(`content_${page}_${field}`, JSON.stringify(content));
      setError('Only admins can save changes. Please log in. Content cached locally.');
      setIsEditing(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetchWithToken(
        `/api/content/${page}`, // Relative path for proxy
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: { [field]: content } }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        const savedContent = data.content?.content?.[field] || content; // Handle nested content
        setContent(savedContent);
        localStorage.setItem(`content_${page}_${field}`, JSON.stringify(savedContent));
        setSuccess('Content saved successfully!');
        setIsEditing(false);
      } else {
        throw new Error('Failed to save content');
      }
    } catch (err) {
      setError(`Failed to save content: ${err.message}`);
      localStorage.setItem(`content_${page}_${field}`, JSON.stringify(content));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <p>Loading content...</p>;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {isEditing ? (
        <>
          <textarea
            value={content || ''}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded mb-2 text-gray-900"
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
          <p className="text-gray-700">{content || ''}</p>
          <button
            onClick={() => setIsEditing(true)}
            className="mt-2 bg-blue-600 text-white p-2 rounded"
          >
            Edit
          </button>
        </>
      ) : (
        <p className="text-gray-700">{content || ''}</p>
      )}
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {success && <div className="text-green-500 mt-2">{success}</div>}
    </div>
  );
};

export default EditableSection;