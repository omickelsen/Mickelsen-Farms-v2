import React, { useState, useEffect, useContext } from 'react';
import { Calendar as RBCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment-timezone';
import Modal from 'react-modal';
import { AuthContext, fetchWithToken } from '../context/AuthContext';
import './CalendarComponent.css';

const localizer = momentLocalizer(moment);

const CalendarComponent = ({ onEventUpdate, height = '800px' }) => {
  const { token, isAdmin } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(moment().toDate());
  const [view, setView] = useState('week');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventForm, setEventForm] = useState({ 
    title: '', 
    start: null, 
    end: null, 
    allDay: false, 
    recurrence: 'Does not repeat', 
    recurrenceEnd: null 
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetchWithToken('http://localhost:5000/api/calendar/events');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const allEvents = Array.isArray(data) ? data.reduce((acc, event) => {
          acc.push({
            id: event.id,
            title: event.summary || 'Untitled Event',
            start: moment.tz(event.start.dateTime || event.start, 'UTC').toDate(),
            end: moment.tz(event.end.dateTime || event.end, 'UTC').toDate(),
            allDay: !event.start.dateTime && !event.end.dateTime,
            recurrence: event.recurrence || 'Does not repeat',
            recurrenceEnd: event.recurrenceEnd || null,
            seriesId: event.seriesId || (event.recurrence !== 'Does not repeat' ? event.id : null),
          });
          return acc;
        }, []) : [];
        setEvents(allEvents);
        setError(null);
        if (onEventUpdate) onEventUpdate(allEvents);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        setEvents([]);
      }
    };
    fetchEvents();
  }, [token, onEventUpdate]);

  const handleNavigate = (newDate, newView, action) => {
    let newMomentDate = moment(date);
    if (action === 'PREV') newMomentDate.subtract(1, view || 'week');
    else if (action === 'NEXT') newMomentDate.add(1, view || 'week');
    else if (action === 'TODAY') newMomentDate = moment();
    else if (action === 'DATE') newMomentDate = moment(newDate);
    else if (action === 'view' && newView) setView(newView);
    setDate(newMomentDate.toDate());
  };

  const handleSelectSlot = ({ start, end }) => {
    if (!isAdmin || !token) {
      alert('Only admins can create events. Please log in.');
      return;
    }
    const startMoment = moment.tz(start, 'America/Los_Angeles');
    const isAllDay = !startMoment.hours() && !startMoment.minutes();
    const endMoment = moment.tz(start, 'America/Los_Angeles').add(isAllDay ? 1 : 1, isAllDay ? 'day' : 'hour');
    setEventForm({ 
      title: '', 
      start: startMoment.toDate(), 
      end: endMoment.toDate(), 
      allDay: isAllDay, 
      recurrence: 'Does not repeat', 
      recurrenceEnd: null 
    });
    setSelectedEvent(null);
    openModal();
  };

  const handleSelectEvent = (event) => {
    if (!isAdmin || !token) {
      alert('Only admins can modify events. Please log in.');
      return;
    }
    setEventForm({
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      id: event.id,
      recurrence: event.recurrence || 'Does not repeat',
      recurrenceEnd: event.recurrenceEnd || null,
    });
    setSelectedEvent(event);
    openModal();
  };

  const [modalIsOpen, setModalIsOpen] = useState(false);

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  const handleSaveEvent = async () => {
    const { title, start, end, allDay, id, recurrence, recurrenceEnd } = eventForm;
    if (!title || !start || !end) {
      alert('Please fill in all fields.');
      return;
    }

    const startMoment = moment.tz(start, 'America/Los_Angeles').utc();
    const endMoment = moment.tz(end, 'America/Los_Angeles').utc();
    const eventData = {
      summary: title,
      start: allDay ? { date: startMoment.format('YYYY-MM-DD') } : { dateTime: startMoment.toISOString(), timeZone: 'UTC' },
      end: allDay ? { date: endMoment.format('YYYY-MM-DD') } : { dateTime: endMoment.toISOString(), timeZone: 'UTC' },
      ...(recurrence !== 'Does not repeat' && { recurrence, recurrenceEnd }),
    };
    console.log('Sending event data to server:', eventData);

    try {
      let response;
      if (id) {
        response = await fetchWithToken(`http://localhost:5000/api/calendar/events/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });
      } else {
        response = await fetchWithToken('http://localhost:5000/api/calendar/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });
      }
      console.log('Fetch response status:', response.status);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const newEvent = await response.json();
      console.log('Response from server:', newEvent);
      const fetchEvents = async () => {
        const response = await fetchWithToken('http://localhost:5000/api/calendar/events');
        if (response.ok) {
          const data = await response.json();
          const allEvents = Array.isArray(data) ? data.reduce((acc, event) => {
            acc.push({
              id: event.id,
              title: event.summary || 'Untitled Event',
              start: moment.tz(event.start.dateTime || event.start, 'UTC').toDate(),
              end: moment.tz(event.end.dateTime || event.end, 'UTC').toDate(),
              allDay: !event.start.dateTime && !event.end.dateTime,
              recurrence: event.recurrence || 'Does not repeat',
              recurrenceEnd: event.recurrenceEnd || null,
              seriesId: event.seriesId || (event.recurrence !== 'Does not repeat' ? event.id : null),
            });
            return acc;
          }, []) : [];
          setEvents(allEvents);
          if (onEventUpdate) onEventUpdate(allEvents);
        }
      };
      await fetchEvents();
      closeModal();
    } catch (err) {
      console.error('Error saving event:', err);
      alert('Failed to save event: ' + err.message);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent?.id) return;
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    const isSeries = selectedEvent.recurrence !== 'Does not repeat' && selectedEvent.seriesId;
    let confirmMessage = 'Are you sure you want to delete this event?';
    if (isSeries) {
      confirmMessage = 'Delete this event only, or the entire series?\nPress OK to delete this event, Cancel to delete the series.';
    }

    try {
      const shouldDeleteSeries = isSeries && !window.confirm(confirmMessage);
      const deleteUrl = `http://localhost:5000/api/calendar/events/${selectedEvent.id}`;
      const response = await fetchWithToken(deleteUrl, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteSeries: shouldDeleteSeries }),
      });
      console.log('Delete response status:', response.status);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      console.log('Delete response:', await response.text());
      closeModal();
      const fetchEvents = async () => {
        const response = await fetchWithToken('http://localhost:5000/api/calendar/events');
        if (response.ok) {
          const data = await response.json();
          const allEvents = Array.isArray(data) ? data.reduce((acc, event) => {
            acc.push({
              id: event.id,
              title: event.summary || 'Untitled Event',
              start: moment.tz(event.start.dateTime || event.start, 'UTC').toDate(),
              end: moment.tz(event.end.dateTime || event.end, 'UTC').toDate(),
              allDay: !event.start.dateTime && !event.end.dateTime,
              recurrence: event.recurrence || 'Does not repeat',
              recurrenceEnd: event.recurrenceEnd || null,
              seriesId: event.seriesId || (event.recurrence !== 'Does not repeat' ? event.id : null),
            });
            return acc;
          }, []) : [];
          setEvents(allEvents);
          if (onEventUpdate) onEventUpdate(allEvents);
        }
      };
      await fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event: ' + err.message);
    }
  };

  const onEventDrop = ({ event, start, end }) => {
    const updatedEvent = { ...event, start, end };
    const updatedEvents = events.map(e => (e.id === event.id ? updatedEvent : e));
    setEvents(updatedEvents);
    if (onEventUpdate) onEventUpdate(updatedEvents);

    fetchWithToken(`http://localhost:5000/api/calendar/events/${event.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: event.title,
        start: { dateTime: moment.tz(start, 'America/Los_Angeles').utc().toISOString(), timeZone: 'UTC' },
        end: { dateTime: moment.tz(end, 'America/Los_Angeles').utc().toISOString(), timeZone: 'UTC' },
      }),
    }).catch(err => console.error('Error updating event on drop:', err));
  };

  const slotPropGetter = () => ({ style: { minHeight: '60px' } });

  const eventPropGetter = (event, start, end, isSelected) => {
    const durationMinutes = moment(end).diff(moment(start), 'minutes');
    const isMultiDay = moment(end).isAfter(moment(start), 'day');
    return {
      style: {
        backgroundColor: isAdmin ? '#4CAF50' : '#3174d6',
        borderRadius: isMultiDay ? '4px 0 0 4px' : '4px',
        color: 'white',
        padding: '2px 6px',
        margin: '2px 0',
        height: isMultiDay ? '100%' : `${durationMinutes / 30 * 30}px`,
        maxHeight: 'none',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        borderRight: isMultiDay ? '1px dashed #fff' : 'none',
      },
    };
  };

  const dayPropGetter = (date) => {
    const dayEvents = events.filter(event =>
      moment(event.start).isSame(date, 'day') || moment(event.end).isSame(date, 'day')
    );
    return { style: { backgroundColor: dayEvents.length > 0 ? '#f0f0f0' : 'transparent' } };
  };

  return (
    <div style={{ height: height, minHeight: '600px' }}>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      {events.length === 0 && !error && <p className="text-center">No events to display.</p>}
      <div className="calendar-container" style={{ height: '100%', minHeight: '600px' }}>
        <RBCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={['month', 'week', 'day', 'agenda']}
          view={view}
          date={date}
          onNavigate={handleNavigate}
          selectable={isAdmin}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onEventDrop={onEventDrop}
          onView={setView}
          draggable={isAdmin}
          resizable={isAdmin}
          step={30}
          timeslots={2}
          slotPropGetter={slotPropGetter}
          eventPropGetter={eventPropGetter}
          dayPropGetter={dayPropGetter}
          components={{
            event: ({ event }) => (
              <div className="p-1 text-white truncate" title={event.title}>
                {event.title} {event.recurrence !== 'Does not repeat' && `(${event.recurrence})`}
              </div>
            ),
          }}
        />
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          style={{
            content: {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              marginRight: '-50%',
              transform: 'translate(-50%, -50%)',
              width: '500px',
              minHeight: '450px',
              padding: '30px',
              borderRadius: '10px',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              color: '#333333',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
            },
            overlay: { backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1000 },
          }}
          contentLabel="Event Modal"
        >
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#333333' }}>
            {selectedEvent ? 'Edit Event' : 'New Event'}
          </h2>
          <input
            type="text"
            value={eventForm.title}
            onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
            placeholder="Event Title"
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            style={{ color: '#333333', backgroundColor: '#f9f9f9' }}
          />
          <label className="block mb-4" style={{ color: '#333333' }}>
            Start:
            <input
              type="datetime-local"
              value={moment(eventForm.start).format('YYYY-MM-DDTHH:mm')}
              onChange={(e) => setEventForm({ ...eventForm, start: new Date(e.target.value) })}
              className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              style={{ color: '#333333', backgroundColor: '#f9f9f9' }}
            />
          </label>
          <label className="block mb-4" style={{ color: '#333333' }}>
            End:
            <input
              type="datetime-local"
              value={moment(eventForm.end).format('YYYY-MM-DDTHH:mm')}
              onChange={(e) => setEventForm({ ...eventForm, end: new Date(e.target.value) })}
              className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              style={{ color: '#333333', backgroundColor: '#f9f9f9' }}
              disabled={eventForm.allDay}
            />
          </label>
          <label className="block mb-4" style={{ color: '#333333' }}>
            All Day:
            <input
              type="checkbox"
              checked={eventForm.allDay}
              onChange={(e) => {
                const isAllDay = e.target.checked;
                setEventForm({
                  ...eventForm,
                  allDay: isAllDay,
                  end: isAllDay ? moment.tz(eventForm.start, 'America/Los_Angeles').add(1, 'day').toDate() : eventForm.end,
                });
              }}
              className="ml-2 mt-1"
            />
          </label>
          <label className="block mb-4" style={{ color: '#333333' }}>
            Recurrence:
            <select
              value={eventForm.recurrence}
              onChange={(e) => setEventForm({ ...eventForm, recurrence: e.target.value })}
              className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="Does not repeat">Does not repeat</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Custom">Custom</option>
            </select>
          </label>
          {eventForm.recurrence !== 'Does not repeat' && (
            <label className="block mb-4" style={{ color: '#333333' }}>
              Ends:
              <select
                value={eventForm.recurrenceEnd ? 'On' : 'Never'}
                onChange={(e) => {
                  setEventForm({ ...eventForm, recurrenceEnd: e.target.value === 'On' ? eventForm.recurrenceEnd || moment().add(1, 'month').toDate() : null });
                }}
                className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="Never">Never</option>
                <option value="On">On</option>
              </select>
              {eventForm.recurrenceEnd && (
                <input
                  type="date"
                  value={moment(eventForm.recurrenceEnd).format('YYYY-MM-DD')}
                  onChange={(e) => setEventForm({ ...eventForm, recurrenceEnd: new Date(e.target.value) })}
                  className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  style={{ color: '#333333', backgroundColor: '#f9f9f9' }}
                />
              )}
            </label>
          )}
          <div className="flex justify-end space-x-4">
            {selectedEvent && (
              <button
                onClick={handleDeleteEvent}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200"
              >
                {selectedEvent.recurrence !== 'Does not repeat' && selectedEvent.seriesId ? 'Delete Series' : 'Delete'}
              </button>
            )}
            <button
              onClick={closeModal}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEvent}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition duration-200"
            >
              Save
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default CalendarComponent;