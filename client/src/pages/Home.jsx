import React, { useState, useEffect } from 'react';
import { fetchWithToken } from '../context/AuthContext';

function Home() {
  const [events, setEvents] = useState([]);
  const [request, setRequest] = useState('');
  const [message, setMessage] = useState('');

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

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request }),
      });
      if (response.ok) {
        setMessage('Request submitted successfully!');
        setRequest('');
      } else {
        setMessage('Failed to submit request.');
      }
    } catch (err) {
      setMessage('Error submitting request: ' + err.message);
    }
  };

  return (
    <div>
      <h2>Welcome to Mickelsen Family Farms</h2>
      <p>About us: A family-owned farm offering horse boarding, lessons, trail rides, and events.</p>
      <h3>Upcoming Events</h3>
      <ul>
        {events.map(event => (
          <li key={event.id}>{event.summary} - {new Date(event.start.dateTime).toLocaleString()}</li>
        ))}
      </ul>
      <h3>Submit a Request</h3>
      <form onSubmit={handleRequestSubmit}>
        <textarea value={request} onChange={(e) => setRequest(e.target.value)} placeholder="Enter your request" />
        <button type="submit">Submit</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default Home;