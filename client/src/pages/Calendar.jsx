import React from 'react';
import { useAuth } from '../context/AuthContext';
import GoogleCalendarComponent from '../components/GoogleCalendarComponent';

function Calendar() {
  const { isAdmin } = useAuth();
 

  return (
    <div className="py-8 bg-white">
      <h2 className="section-title">Calendar</h2> {/* Moved title here */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <GoogleCalendarComponent height="800px" />
        {isAdmin && (
          <div className="mt-2 text-center">
            <a href={`https://calendar.google.com/calendar/r?cid=${import.meta.env.VITE_GOOGLE_CALENDAR_ID || 'mickelsenfamilyfarms@gmail.com'}`} target="_blank" rel="noopener noreferrer" className="btn-primary" onClick={(e) => console.log('Clicked Manage Calendar, URL:', `https://calendar.google.com/calendar/r?cid=${import.meta.env.VITE_GOOGLE_CALENDAR_ID || 'mickelsenfamilyfarms@gmail.com'}`)}>
              Manage Calendar
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default Calendar;