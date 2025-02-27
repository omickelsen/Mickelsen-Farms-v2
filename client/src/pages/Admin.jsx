import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, fetchWithToken } from '../context/AuthContext';

const ADMIN_EMAILS = ['omickelsen@gmail.com', 'mickelsenfamilyfarms@gmail.com'];

function Admin() {
  const { token, logout, loading, error } = useContext(AuthContext);
  const [page, setPage] = useState('our-story');
  const [content, setContent] = useState('');
  const [events, setEvents] = useState([]);
  const [newEventSummary, setNewEventSummary] = useState('');
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    console.log('Admin token updated:', token);
    if (token) {
      fetchUserEmail(token).then(email => {
        setIsAdmin(ADMIN_EMAILS.includes(email));
      }).catch(err => console.error('Error verifying admin:', err));
    }
  }, [token]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!token || !isAdmin) {
        console.log('No token or not admin, skipping fetch');
        return;
      }
      console.log('Fetching events with token:', token);
      setLoading(true);
      setError(null);
      try {
        const response = await fetchWithToken('http://localhost:5000/api/calendar/events');
        if (!response.ok) throw new Error(`Failed to fetch events: ${response.statusText}`);
        const data = await response.json();
        console.log('Fetched events:', data);
        setEvents(data);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [token, isAdmin]);

  const fetchUserEmail = async (idToken) => {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${idToken}`);
    const data = await response.json();
    return data.email;
  };

  const saveContent = async () => {
    if (!token || !isAdmin) return alert('Please authenticate with an admin account');
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithToken(`http://localhost:5000/api/content/${page}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error(`Failed to save content: ${response.statusText}`);
      alert('Content saved successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async () => {
    if (!token || !isAdmin) return alert('Please authenticate with an admin account');
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithToken('http://localhost:5000/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: 'New Admin Event',
          start: { dateTime: new Date().toISOString() },
          end: { dateTime: new Date(Date.now() + 3600000).toISOString() },
        }),
      });
      if (!response.ok) throw new Error(`Failed to create event: ${response.statusText}`);
      const newEvent = await response.json();
      setEvents([...events, newEvent]);
      alert('Event created successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (eventId) => {
    if (!token || !isAdmin) return alert('Please authenticate with an admin account');
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithToken(`http://localhost:5000/api/calendar/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: newEventSummary || 'Updated Event' }),
      });
      if (!response.ok) throw new Error(`Failed to update event: ${response.statusText}`);
      const updatedEvent = await response.json();
      setEvents(events.map(e => e.id === eventId ? updatedEvent : e));
      setSelectedEventId(null);
      alert('Event updated successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId) => {
    if (!token || !isAdmin) return alert('Please authenticate with an admin account');
    if (window.confirm('Are you sure you want to delete this event?')) {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchWithToken(`http://localhost:5000/api/calendar/events/${eventId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error(`Failed to delete event: ${response.statusText}`);
        setEvents(events.filter(e => e.id !== eventId));
        alert('Event deleted successfully');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      {!isAdmin ? (
        <div>
          <p>Please log in with an admin account.</p>
          <div id="google-signin"></div>
        </div>
      ) : (
        <>
          <select value={page} onChange={(e) => setPage(e.target.value)}>
            <option value="our-story">Our Story</option>
            <option value="horse-boarding">Horse Boarding</option>
            <option value="events">Events</option>
            <option value="horse-lessons">Horse Lessons</option>
            <option value="trail-rides">Trail Rides</option>
          </select>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} />
          <button onClick={saveContent}>Save Content</button>

          <h2>Manage Calendar Events</h2>
          <ul>
            {events.map(event => (
              <li key={event.id}>
                {event.summary} - {new Date(event.start.dateTime).toLocaleString()}
                <input
                  type="text"
                  value={newEventSummary}
                  onChange={(e) => setNewEventSummary(e.target.value)}
                  placeholder="New summary for update"
                />
                <button onClick={() => updateEvent(event.id)}>Update</button>
                <button onClick={() => deleteEvent(event.id)}>Delete</button>
              </li>
            ))}
          </ul>
          <button onClick={addEvent}>Add New Event</button>
          <button onClick={logout}>Logout</button>
        </>
      )}
    </div>
  );
}

export default Admin;