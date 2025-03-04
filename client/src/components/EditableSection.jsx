import React, { useState, useEffect } from 'react';
import { useAuth, fetchWithToken } from '../context/AuthContext';

const EditableSection = ({ page, initialContent, field }) => {
  const { token, isAdmin } = useAuth() || {};
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load content on mount with logging
  useEffect(() => {
    console.log(`[Client] Attempting to fetch content for page: ${page}, field: ${field}`);
    const cachedContent = localStorage.getItem(`content_${page}_${field}`);
    if (cachedContent) {
      const parsedContent = JSON.parse(cachedContent);
      console.log(`[Client] Loaded cached content for ${page}/${field}:`, parsedContent);
      setContent(parsedContent);
    }
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        console.log(`[Client] Sending GET request to /api/content/${page}`);
        const response = await fetch(
          process.env.NODE_ENV === 'production'
            ? `https://your-heroku-app.herokuapp.com/api/content/${page}`
            : `http://localhost:5000/api/content/${page}`
        );
        console.log(`[Client] Received response for GET /api/content/${page}, status: ${response.status}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`[Client] Fetched data for ${page}:`, data);
          const newContent = data.content?.content?.[field] || initialContent; // Handle nested content
          setContent(newContent);
          localStorage.setItem(`content_${page}_${field}`, JSON.stringify(newContent));
          console.log(`[Client] Cached new content for ${page}/${field}:`, newContent);
        } else if (!cachedContent) {
          console.log(`[Client] Fetch failed, using initialContent for ${page}/${field}`);
          setContent(initialContent);
        }
      } catch (err) {
        console.error(`[Client] Error fetching content for ${page}:`, err);
        if (!cachedContent) setContent(initialContent);
      } finally {
        setIsLoading(false);
        console.log(`[Client] Finished loading content for ${page}/${field}`);
      }
    };
    fetchContent();
  }, [page, field, initialContent]);

  // Handle save with logging
  const handleSave = async () => {
    console.log(`[Client] Attempting to save content for ${page}/${field}:`, content);
    if (!isAdmin || !token) {
      console.log(`[Client] User not admin or no token, caching locally for ${page}/${field}`);
      alert('Only admins can save changes. Please log in.');
      localStorage.setItem(`content_${page}_${field}`, JSON.stringify(content));
      setIsEditing(false);
      return;
    }
    setIsLoading(true);
    try {
      console.log(`[Client] Sending POST request to /api/content/${page} with data:`, { content: { [field]: content } });
      const response = await fetchWithToken(
        process.env.NODE_ENV === 'production'
          ? `https://your-heroku-app.herokuapp.com/api/content/${page}`
          : `http://localhost:5000/api/content/${page}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: { [field]: content } }),
        }
      );
      console.log(`[Client] Received response for POST /api/content/${page}, status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`[Client] Saved data for ${page}:`, data);
        const savedContent = data.content?.content?.[field] || content; // Handle nested content
        setContent(savedContent);
        localStorage.setItem(`content_${page}_${field}`, JSON.stringify(savedContent));
        console.log(`[Client] Updated content and cache for ${page}/${field}:`, savedContent);
        setIsEditing(false);
        alert('Content saved successfully!');
      } else {
        throw new Error('Failed to save content');
      }
    } catch (err) {
      console.error(`[Client] Error saving content for ${page}:`, err);
      alert('Failed to save content: ' + err.message);
      localStorage.setItem(`content_${page}_${field}`, JSON.stringify(content));
    } finally {
      setIsLoading(false);
      console.log(`[Client] Finished save attempt for ${page}/${field}`);
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
            className="w-full p-2 border rounded mb-2 text-gray-900" // Changed text color to dark gray
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
    </div>
  );
};

export default EditableSection;