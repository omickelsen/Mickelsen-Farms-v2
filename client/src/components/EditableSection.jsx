import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth, fetchWithToken } from '../context/AuthContext';

const EditableSection = ({ page, initialContent, field }) => {
  const { token, isAdmin } = useAuth() || {};
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/content/${page}`);
        if (response.ok) {
          const data = await response.json();
          const newContent = data.content?.[field] || initialContent;
          setContent(newContent);
          localStorage.setItem(`content_${page}_${field}`, JSON.stringify(newContent));
        } else {
          console.warn(`Fetch failed with status ${response.status}, using local storage for ${page}, ${field}`);
          const cachedContent = localStorage.getItem(`content_${page}_${field}`);
          setContent(cachedContent ? JSON.parse(cachedContent) : initialContent);
        }
      } catch (err) {
        console.error(`Fetch error for ${page}, ${field}:`, err);
        const cachedContent = localStorage.getItem(`content_${page}_${field}`);
        setContent(cachedContent ? JSON.parse(cachedContent) : initialContent);
        setError('Failed to fetch content. Using cached or initial content.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [page, field, initialContent]);

  const handleSave = async () => {
    if (!isAdmin || !token) {
      setContent(content);
      localStorage.setItem(`content_${page}_${field}`, JSON.stringify(content));
      setError('Only admins can save changes to the server. Content cached locally.');
      setIsEditing(false);
      return;
    }
    setIsLoading(true);
    const updatedContent = content;
    localStorage.setItem(`content_${page}_${field}`, JSON.stringify(updatedContent));
    try {
      const response = await fetchWithToken(
        `/api/content/${page}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: { [field]: updatedContent } }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        const newContent = data.content?.[field] || updatedContent;
        setContent(newContent);
        localStorage.setItem(`content_${page}_${field}`, JSON.stringify(newContent));
        setSuccess('Content saved successfully!');
      } else {
        console.warn(`Save failed with status ${response.status} for ${page}, ${field}, using local content`);
        setContent(updatedContent);
        setError(`Failed to save to server: ${await response.text()}. Using locally cached content.`);
      }
    } catch (err) {
      console.error(`Save error for ${page}, ${field}:`, err);
      setContent(updatedContent);
      setError(`Failed to save to server: ${err.message}. Using locally cached content.`);
      localStorage.setItem(`content_${page}_${field}`, JSON.stringify(updatedContent));
    } finally {
      setIsEditing(false);
      setIsLoading(false);
    }
  };

  if (isLoading) return <p>Loading content...</p>;

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['clean'],
    ],
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'color', 'background', 'align',
  ];

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {isEditing ? (
        <>
          <ReactQuill
            value={content || initialContent}
            onChange={setContent}
            modules={modules}
            formats={formats}
            className="mb-4 text-gray-900"
            placeholder="Edit content here..."
          />
          <button
            onClick={handleSave}
            className="bg-teal-600 text-white p-2 rounded mr-2"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="bg-gray-500 text-white p-2 rounded"
            disabled={isLoading}
          >
            Cancel
          </button>
        </>
      ) : isAdmin ? (
        <>
          <div
            className="ql-content"
            dangerouslySetInnerHTML={{ __html: content || initialContent }}
          />
          <button
            onClick={() => setIsEditing(true)}
            className="mt-2 bg-blue-600 text-white p-2 rounded"
          >
            Edit
          </button>
        </>
      ) : (
        <div
          className="ql-content"
          dangerouslySetInnerHTML={{ __html: content || initialContent }}
        />
      )}
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {success && <div className="text-green-500 mt-2">{success}</div>}
    </div>
  );
};

export default EditableSection;