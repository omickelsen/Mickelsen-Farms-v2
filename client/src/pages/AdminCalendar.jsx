import React, { useState, useEffect } from 'react';
import { fetchWithToken } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext'; // Added import

const AdminCalendar = () => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ summary: '', start: '', end: '' });
  const { token } = useAuth();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetchWithToken('http://localhost:5000/api/calendar/events');
        if (!response.ok) throw new Error('Failed to fetch events');
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };
    fetchEvents();
  }, []);

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      const response = await fetchWithToken('http://localhost:5000/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: newEvent.summary,
          start: newEvent.start,
          end: newEvent.end,
        }),
      });
      if (!response.ok) throw new Error('Failed to add event');
      const data = await response.json();
      setEvents([...events, data]);
      setNewEvent({ summary: '', start: '', end: '' });
    } catch (err) {
      console.error('Error adding event:', err);
    }
  };

  const handleUpdateEvent = async (id, updatedEvent) => {
    try {
      const response = await fetchWithToken(`http://localhost:5000/api/calendar/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEvent),
      });
      if (!response.ok) throw new Error('Failed to update event');
      const data = await response.json();
      setEvents(events.map(event => (event.id === id ? data : event)));
    } catch (err) {
      console.error('Error updating event:', err);
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      const response = await fetchWithToken(`http://localhost:5000/api/calendar/events/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete event');
      setEvents(events.filter(event => event.id !== id));
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  return (
    <div>
      <h1>Admin Calendar</h1>
      <form onSubmit={handleAddEvent}>
        <input
          value={newEvent.summary}
          onChange={(e) => setNewEvent({ ...newEvent, summary: e.target.value })}
          placeholder="Event Title"
          className="border p-2 mr-2"
        />
        <input
          type="datetime-local"
          value={newEvent.start}
          onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
          className="border p-2 mr-2"
        />
        <input
          type="datetime-local"
          value={newEvent.end}
          onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
          className="border p-2 mr-2"
        />
        <button type="submit" className="bg-teal-600 text-white p-2 rounded">
          Add Event
        </button>
      </form>
      <ul>
        {events.map(event => (
          <li key={event.id}>
            {event.summary} ({new Date(event.start.dateTime).toLocaleString()} - {new Date(event.end.dateTime).toLocaleString()})
            <button
              onClick={() => handleUpdateEvent(event.id, { summary: prompt('New title:', event.summary) })}
              className="bg-blue-500 text-white p-1 ml-2 rounded"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteEvent(event.id)}
              className="bg-red-500 text-white p-1 ml-2 rounded"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminCalendar;