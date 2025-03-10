import React from 'react';
import { useAuth } from '../context/AuthContext';
import GoogleCalendarComponent from '../components/GoogleCalendarComponent';

function Calendar() {
  const { isAdmin } = useAuth();

  return (
    <div className="py-4 bg-white">
      <h2 className="section-title">Calendar</h2>
      <div className="w-full mx-auto px-2 sm:px-4 lg:px-6">
        <GoogleCalendarComponent height="800px" />
        {isAdmin && (
          <div className="mt-2 text-center">
            <a
              href={`https://calendar.google.com/calendar/r?cid=${import.meta.env.VITE_GOOGLE_CALENDAR_ID || 'mickelsenfamilyfarms@gmail.com'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              onClick={(e) => console.log('Clicked Manage Calendar, URL:', 'mickelsenfamilyfarms@gmail.com')}
            >
              Manage Calendar
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default Calendar;