import React, { useState, useEffect } from 'react';
import { useAuth, fetchWithToken } from '../context/AuthContext';

const StatusIndicator = ({ page, initialStatus }) => {
  const { isAdmin, token } = useAuth() || {};
  const [status, setStatus] = useState(initialStatus || "Full"); // Default to "Full"
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch the status from the server on mount
  useEffect(() => {
    const fetchStatus = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/content/${page}`);
        if (response.ok) {
          const data = await response.json();
          const fetchedStatus = data.content?.status || initialStatus || "Full";
          setStatus(fetchedStatus);
          localStorage.setItem(`content_${page}_status`, JSON.stringify(fetchedStatus));
        } else {
          console.warn(`Fetch failed with status ${response.status}, using local storage for ${page}`);
          const cachedStatus = localStorage.getItem(`content_${page}_status`);
          setStatus(cachedStatus ? JSON.parse(cachedStatus) : initialStatus || "Full");
        }
      } catch (err) {
        console.error(`Fetch error for ${page}:`, err);
        const cachedStatus = localStorage.getItem(`content_${page}_status`);
        setStatus(cachedStatus ? JSON.parse(cachedStatus) : initialStatus || "Full");
        setError('Failed to fetch status. Using cached or initial status.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, [page, initialStatus]);

  // Determine color based on status (case-insensitive)
  const getStatusColor = (statusText) => {
    const lowerText = statusText.toLowerCase();
    return lowerText.includes('available') ? 'text-green-600' : 'text-red-600';
  };

  // Handle status toggle for admins
  const handleToggle = async () => {
    if (!isAdmin || !token) {
      setError('Only admins can change the status.');
      return;
    }

    const newStatus = status.toLowerCase().includes('available') ? "Full" : "Available";
    setIsLoading(true);
    setStatus(newStatus);
    localStorage.setItem(`content_${page}_status`, JSON.stringify(newStatus));

    try {
      const response = await fetchWithToken(`/api/content/${page}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { status: newStatus } }),
      });
      if (response.ok) {
        const data = await response.json();
        const updatedStatus = data.content?.status || newStatus;
        setStatus(updatedStatus);
        localStorage.setItem(`content_${page}_status`, JSON.stringify(updatedStatus));
        setSuccess('Status updated successfully!');
        setError(null);
      } else {
        throw new Error(`Failed to save status: ${await response.text()}`);
      }
    } catch (err) {
      console.error(`Error saving status for ${page}:`, err);
      setError(`Failed to save status: ${err.message}. Using local status.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <p className="text-center text-gray-500">Loading status...</p>;

  return (
    <div className="flex justify-center items-center mb-6">
      <div className="inline-flex items-center bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
        <span className="text-lg font-semibold text-gray-800 mr-2">Current Status:</span>
        <span className={`text-lg font-bold ${getStatusColor(status)}`}>{status}</span>
        {isAdmin && (
          <button
            onClick={handleToggle}
            className={`ml-4 px-3 py-1 rounded-md text-white text-sm font-medium transition-colors duration-200 ${
              status.toLowerCase().includes('available') ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : `Set to ${status.toLowerCase().includes('available') ? 'Full' : 'Available'}`}
          </button>
        )}
      </div>
      {error && <div className="ml-4 text-red-500 text-sm">{error}</div>}
      {success && <div className="ml-4 text-green-500 text-sm">{success}</div>}
    </div>
  );
};

export default StatusIndicator;