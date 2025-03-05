import React, { useState, useEffect } from 'react';
import { useAuth, fetchWithToken } from '../context/AuthContext';

const EditableSection = ({ page, initialContent, field }) => {
  const { token, isAdmin } = useAuth() || {};
  const [content, setContent] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load full content on mount
  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/content/${page}`);
        if (response.ok) {
          const data = await response.json();
          setContent(data.content || {});
          localStorage.setItem(`content_${page}`, JSON.stringify(data.content || {}));
        } else {
          setContent({ [field]: initialContent });
          localStorage.setItem(`content_${page}`, JSON.stringify({ [field]: initialContent }));
        }
      } catch (err) {
        const cachedContent = localStorage.getItem(`content_${page}`);
        setContent(cachedContent ? JSON.parse(cachedContent) : { [field]: initialContent });
        setError('Failed to fetch content. Using cached or initial content.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [page, field, initialContent]);

  // Handle save
  const handleSave = async () => {
    if (!isAdmin || !token) {
      setContent((prev) => ({ ...prev, [field]: content[field] }));
      localStorage.setItem(`content_${page}`, JSON.stringify({ ...content, [field]: content[field] }));
      setError('Only admins can save changes to the server. Content cached locally.');
      setIsEditing(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetchWithToken(
        `/api/content/${page}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: { ...content, [field]: content[field] } }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setContent(data.content || {});
        localStorage.setItem(`content_${page}`, JSON.stringify(data.content || {}));
        setSuccess('Content saved successfully!');
        setIsEditing(false);
      } else {
        throw new Error('Failed to save content');
      }
    } catch (err) {
      setError(`Failed to save content: ${err.message}`);
      localStorage.setItem(`content_${page}`, JSON.stringify({ ...content, [field]: content[field] }));
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
            value={content[field] || ''}
            onChange={(e) => setContent((prev) => ({ ...prev, [field]: e.target.value }))}
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
          <p className="text-gray-700">{content[field] || ''}</p>
          <button
            onClick={() => setIsEditing(true)}
            className="mt-2 bg-blue-600 text-white p-2 rounded"
          >
            Edit
          </button>
        </>
      ) : (
        <p className="text-gray-700">{content[field] || ''}</p>
      )}
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {success && <div className="text-green-500 mt-2">{success}</div>}
    </div>
  );
};

export default EditableSection;