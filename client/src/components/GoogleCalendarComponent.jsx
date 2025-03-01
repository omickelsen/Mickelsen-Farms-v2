import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './GoogleCalendarComponent.css'; // Import the CSS file

const GoogleCalendarComponent = ({ height = '800px' }) => { // Increased default height to 800px
  const { isAdmin, token } = useAuth();

  useEffect(() => {
  }, [isAdmin, token]);

  const calendarId = import.meta.env.VITE_GOOGLE_CALENDAR_ID || 'mickelsenfamilyfarms@gmail.com';
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || 'AIzaSyBUIZldcTjBKL4nVnsXNg0f_YbIdoCoS4g';

  const iframeSrc = `https://www.google.com/calendar/embed?src=${encodeURIComponent(
    calendarId
  )}&ctz=America/Los_Angeles&mode=WEEK&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&height=${height.replace(
    'px',
    ''
  )}&wkst=1&bgcolor=%23FFFFFF&key=${apiKey}`;

  return (
    <div className="calendar-section">
      <div
        className="calendar-iframe-container"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1200px', // Increased max width for larger screens
          margin: '0 auto',
          overflow: 'hidden',
          border: '1px solid #ddd',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        <iframe
          src={iframeSrc}
          style={{ width: '100%', height: height, border: '0' }}
          frameBorder="0"
          scrolling="no"
          title="Google Calendar"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default GoogleCalendarComponent;