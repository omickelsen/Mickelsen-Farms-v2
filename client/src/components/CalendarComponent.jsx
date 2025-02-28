import { useState, useEffect, useContext } from 'react';
import { Calendar as RBCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { AuthContext, fetchWithToken } from '../context/AuthContext';
import './CalendarComponent.css';

const localizer = momentLocalizer(moment);

const CalendarComponent = ({ onEventUpdate, height = '800px' }) => {
  const [events, setEvents] = useState([]);
  const { token, isAdmin } = useContext(AuthContext);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(moment().toDate());
  const [view, setView] = useState('month'); // Controlled view state

  useEffect(() => {
    console.log('useEffect triggered, initial view:', view, 'date:', date);
    const fetchEvents = async () => {
      console.log('Starting fetch for events');
      try {
        const response = await fetch('http://localhost:5000/api/calendar/events');
        console.log('Fetch response:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const formattedEvents = data.map(event => {
          const start = new Date(event.start.dateTime || event.start.date || new Date());
          const end = new Date(event.end.dateTime || event.end.date || new Date(start.getTime() + 3600000));
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            console.warn('Invalid date in event, skipping:', event);
            return null;
          }
          return {
            title: event.summary || 'Untitled Event',
            start: moment(start).toDate(),
            end: moment(end).toDate(),
            allDay: !event.start.dateTime && !event.end.dateTime,
            id: event.id || Math.random().toString(36).substr(2, 9),
            resource: event,
          };
        }).filter(event => event !== null);
        console.log('Events formatted:', formattedEvents.map(e => ({ title: e.title, start: e.start, end: e.end })));
        setEvents(formattedEvents);
        setError(null);
        if (onEventUpdate) onEventUpdate(formattedEvents);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        setEvents([]);
      }
      console.log('Events set to:', events);
    };
    fetchEvents().catch(err => console.error('UseEffect error:', err));
  }, [onEventUpdate]);

  const handleNavigate = (newDate, view, action) => {
    console.log('Navigating:', { newDate, view, action, currentView: view });
    let newMomentDate = moment(date);
    if (action === 'PREV') {
      newMomentDate = newMomentDate.subtract(1, view || 'month');
    } else if (action === 'NEXT') {
      newMomentDate = newMomentDate.add(1, view || 'month');
    } else if (action === 'TODAY') {
      newMomentDate = moment();
    } else if (action === 'DATE') {
      newMomentDate = moment(newDate);
    }
    setDate(newMomentDate.toDate());
  };

  const handleSelectSlot = async ({ start, end }) => {
    if (!isAdmin || !token) {
      alert('Only admins can create events. Please log in.');
      return;
    }
    const title = prompt('Enter event title:');
    if (title) {
      const event = { summary: title, start: moment(start).toISOString(), end: moment(end).toISOString() };
      try {
        const response = await fetchWithToken('http://localhost:5000/api/calendar/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
        if (!response.ok) throw new Error('Failed to create event');
        const newEvent = await response.json();
        const updatedEvents = [...events, {
          title: newEvent.summary,
          start: moment(newEvent.start.dateTime).toDate(),
          end: moment(newEvent.end.dateTime).toDate(),
          id: newEvent.id,
          resource: newEvent,
        }];
        setEvents(updatedEvents);
        if (onEventUpdate) onEventUpdate(updatedEvents);
      } catch (err) {
        console.error('Error creating event:', err);
        alert('Failed to create event: ' + err.message);
      }
    }
  };

  const handleSelectEvent = (event, e) => {
    if (!isAdmin || !token) {
      alert('Only admins can modify events. Please log in.');
      return;
    }
    if (e && e.target && e.target.classList.contains('rbc-event') && e.target.textContent.includes('+')) {
      console.log('Expanding multi-event view');
      // Rely on default behavior for +3 more
    }
    const action = window.confirm('Update event title or delete? Press OK to update, Cancel to delete.');
    if (action) {
      (async () => {
        try {
          const newTitle = prompt('Update event title:', event.title);
          if (newTitle && newTitle !== event.title) {
            const response = await fetchWithToken(`http://localhost:5000/api/calendar/events/${event.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ summary: newTitle }),
            });
            if (!response.ok) throw new Error('Failed to update event');
            const updatedEvent = await response.json();
            const updatedEvents = events.map(e => e.id === event.id ? {
              ...e,
              title: updatedEvent.summary,
              resource: updatedEvent,
            } : e);
            setEvents(updatedEvents);
            if (onEventUpdate) onEventUpdate(updatedEvents);
            alert('Event updated successfully');
          }
        } catch (err) {
          console.error('Error updating event:', err);
          alert('Failed to update event: ' + err.message);
        }
      })();
    } else if (window.confirm('Are you sure you want to delete this event?')) {
      (async () => {
        try {
          const response = await fetchWithToken(`http://localhost:5000/api/calendar/events/${event.id}`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('Failed to delete event');
          const updatedEvents = events.filter(e => e.id !== event.id);
          setEvents(updatedEvents);
          if (onEventUpdate) onEventUpdate(updatedEvents);
          alert('Event deleted successfully');
        } catch (err) {
          console.error('Error deleting event:', err);
          alert('Failed to delete event: ' + err.message);
        }
      })();
    }
  };

  return (
    <div style={{ height: '900px', minHeight: '600px' }}>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      {events.length === 0 && !error && <p className="text-center">No events to display.</p>}
      <div className="calendar-container">
        <RBCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={['month', 'week', 'day']}
          defaultView={view} // Set initial view
          date={date}
          onNavigate={handleNavigate}
          selectable={isAdmin}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onView={setView} // Sync view state with internal changes
          key={`${view}-${date.toISOString()}`} // Force re-render on view or date change
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: isAdmin ? '#4CAF50' : '#3174d6',
            },
          })}
        />
      </div>
      {console.log('Rendering calendar with events:', events)}
    </div>
  );
};

export default CalendarComponent;