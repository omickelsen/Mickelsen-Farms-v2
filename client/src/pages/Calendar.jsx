import React, { useState, useEffect } from 'react';

function Calendar() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/calendar/events');
        if (!response.ok) throw new Error('Failed to fetch events');
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div>
      <h2>Calendar</h2>
      <ul>
        {events.map(event => (
          <li key={event.id}>{event.summary} - {new Date(event.start.dateTime).toLocaleString()}</li>
        ))}
      </ul>
    </div>
  );
}

export default Calendar;