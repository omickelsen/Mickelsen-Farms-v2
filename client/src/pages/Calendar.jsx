import { useState, useEffect } from 'react';
import CalendarComponent from '../components/CalendarComponent';

function Calendar() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const syncEvents = (newEvents) => {
      setEvents(newEvents);
    };
  }, []);

  return (
    <div className="py-16 bg-white">
      <h2 className="section-title">Calendar</h2>
      <div className="max-w-5xl mx-auto">
        <CalendarComponent onEventUpdate={setEvents} height="1000px" />
      </div>
    </div>
  );
}

export default Calendar;