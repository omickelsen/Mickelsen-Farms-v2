import React, { useState, useEffect } from 'react';
import { useAuth, fetchWithToken } from '../context/AuthContext';

const InstructorAvailability = ({ page }) => {
  const { isAdmin, token } = useAuth() || {};
  const [instructors, setInstructors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newInstructorName, setNewInstructorName] = useState('');
  const [loadingInstructors, setLoadingInstructors] = useState({}); // Track loading state per instructor

  // Fetch instructors from the server on mount
  const fetchInstructors = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use the new dedicated instructors endpoint
      const cacheBuster = new Date().getTime();
      const response = await fetch(`/api/instructors/${page}?t=${cacheBuster}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched instructors:', data);
        
        // Sort instructors by availability (available first)
        const sortedInstructors = [...(data.instructors || [])].sort((a, b) => {
          const aAvailable = (a.status || '').toLowerCase().includes('available');
          const bAvailable = (b.status || '').toLowerCase().includes('available');
          return bAvailable - aAvailable; // Available first
        });
        
        setInstructors(sortedInstructors);
      } else {
        const errorText = await response.text();
        console.error(`Fetch failed with status ${response.status} for instructors/${page}: ${errorText}`);
        throw new Error(`Failed to fetch instructors: ${errorText}`);
      }
    } catch (err) {
      console.error(`Fetch error for ${page} instructors:`, err);
      setError(`Failed to fetch instructors: ${err.message}`);
      setInstructors([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, [page]);

  // Determine color based on status (case-insensitive)
  const getStatusColor = (statusText) => {
    const lowerText = statusText.toLowerCase();
    return lowerText.includes('available') ? 'text-green-600' : 'text-red-600';
  };

  // Get user-friendly status display text
  const getStatusDisplayText = (statusText) => {
    const lowerText = statusText.toLowerCase();
    return lowerText.includes('available') ? 'Lesson space available' : 'No openings currently';
  };

  // Handle status toggle for instructors
  const handleToggle = async (instructor) => {
    if (!isAdmin || !token) {
      setError('Only admins can change the status.');
      return;
    }
    
    const instructorId = instructor._id;
    
    // Set loading state for this specific instructor
    setLoadingInstructors(prev => ({
      ...prev,
      [instructorId]: true
    }));
    
    console.log(`Toggling instructor ${instructor.name} (${instructorId}) from ${instructor.status}`);
    
    const newStatus = instructor.status.toLowerCase().includes('available') ? "Full" : "Available";
    const newStatusDisplay = getStatusDisplayText(newStatus);
    console.log(`New status will be: ${newStatus} (display as: ${newStatusDisplay})`);

    try {
      console.log(`Sending update request to /api/instructors/${page}/${instructorId}`);
      
      const response = await fetchWithToken(`/api/instructors/${page}/${instructorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Server response:', data);
        
        // Only update this specific instructor, not the entire list
        setInstructors(prevInstructors => 
          prevInstructors.map(i => 
            i._id === instructorId ? data.instructor : i
          )
        );
        
        setSuccess(`Status for ${instructor.name} updated to ${newStatusDisplay}`);
        setError(null);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to save status: ${errorText}`);
      }
    } catch (err) {
      console.error(`Error saving instructor status for ${page}:`, err);
      setError(`Failed to save status: ${err.message}`);
    } finally {
      // Clear loading state for this specific instructor
      setLoadingInstructors(prev => ({
        ...prev,
        [instructorId]: false
      }));
    }
  };

  // Add a new instructor
  const handleAddInstructor = async () => {
    if (!isAdmin || !token) {
      setError('Only admins can add instructors.');
      return;
    }
    
    if (!newInstructorName.trim()) {
      setError('Please provide a name for the instructor.');
      return;
    }

    const newInstructor = {
      name: newInstructorName.trim(),
      status: 'Available'
    };

    setIsLoading(true);
    try {
      const response = await fetchWithToken(`/api/instructors/${page}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInstructor),
      });
      
      if (response.ok) {
        const data = await response.json();
        setNewInstructorName(''); // Clear the input field
        setSuccess('Instructor added successfully!');
        setError(null);
        
        // Add the new instructor to the list without re-fetching
        setInstructors(prev => [...prev, data.instructor]);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to add instructor: ${errorText}`);
      }
    } catch (err) {
      console.error(`Error adding instructor for ${page}:`, err);
      setError(`Failed to add instructor: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove an instructor
  const handleRemoveInstructor = async (instructorId) => {
    if (!isAdmin || !token) {
      setError('Only admins can remove instructors.');
      return;
    }

    // Set loading state for this specific instructor
    setLoadingInstructors(prev => ({
      ...prev,
      [instructorId]: true
    }));

    try {
      const response = await fetchWithToken(`/api/instructors/${page}/${instructorId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSuccess('Instructor removed successfully!');
        setError(null);
        
        // Update the UI immediately
        setInstructors(instructors.filter(i => i._id !== instructorId));
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to remove instructor: ${errorText}`);
      }
    } catch (err) {
      console.error(`Error removing instructor for ${page}:`, err);
      setError(`Failed to remove instructor: ${err.message}`);
    } finally {
      // Clear loading state for this specific instructor
      setLoadingInstructors(prev => ({
        ...prev,
        [instructorId]: false
      }));
    }
  };

  if (isLoading && instructors.length === 0) {
    return <p className="text-center text-gray-500">Loading instructors...</p>;
  }

  return (
    <div className="mb-6">
      {/* Instructor List */}
      <div className="space-y-3">
        {instructors.length > 0 ? (
          instructors.map((instructor) => (
            <div key={instructor._id} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200">
              <span className="text-lg font-semibold text-gray-800">{instructor.name}</span>
              <div className="flex items-center">
                <span className={`ml-2 font-bold ${getStatusColor(instructor.status)}`}>
                  {getStatusDisplayText(instructor.status)}
                </span>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => handleToggle(instructor)}
                      className={`ml-4 px-3 py-1 rounded-md text-white text-sm font-medium transition-colors duration-200 ${
                        instructor.status.toLowerCase().includes('available') ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                      }`}
                      disabled={loadingInstructors[instructor._id]}
                    >
                      {loadingInstructors[instructor._id] ? 'Updating...' : `Set to ${instructor.status.toLowerCase().includes('available') ? 'No openings' : 'Available'}`}
                    </button>
                    <button
                      onClick={() => handleRemoveInstructor(instructor._id)}
                      className="ml-2 px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm font-medium transition-colors duration-200"
                      disabled={loadingInstructors[instructor._id]}
                    >
                      {loadingInstructors[instructor._id] ? 'Removing...' : 'Remove'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600 py-3 bg-white rounded-lg shadow-sm border border-gray-200">No instructors available.</p>
        )}
      </div>

      {/* Add New Instructor Form - Admin Only */}
      {isAdmin && (
        <div className="mt-4 flex items-center space-x-2">
          <input
            type="text"
            value={newInstructorName}
            onChange={(e) => setNewInstructorName(e.target.value)}
            placeholder="Enter instructor name"
            className="flex-1 border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            disabled={isLoading}
          />
          <button
            onClick={handleAddInstructor}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors duration-200 disabled:opacity-50"
            disabled={!newInstructorName.trim() || isLoading}
          >
            {isLoading ? 'Adding...' : 'Add Instructor'}
          </button>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && <div className="mt-3 text-red-500 text-sm bg-red-50 p-2 rounded-md">{error}</div>}
      {success && <div className="mt-3 text-green-500 text-sm bg-green-50 p-2 rounded-md">{success}</div>}
    </div>
  );
};

export default InstructorAvailability; 