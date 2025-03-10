import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './GoogleCalendarComponent.css';

const GoogleCalendarComponent = ({ height = '800px' }) => {
  const { isAdmin, token } = useAuth();

  useEffect(() => {
    // No console.log or sensitive data exposure
  }, [isAdmin, token]);

  const calendarId = import.meta.env.VITE_GOOGLE_CALENDAR_ID;
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

  if (!calendarId || !apiKey) {
    return <div>Error: Calendar ID or API Key not configured. Please check .env file.</div>;
  }

  // Add `showTz=0` to disable timezone display, which might help with mobile rendering
  const iframeSrc = `https://www.google.com/calendar/embed?src=${encodeURIComponent(
    calendarId
  )}&ctz=America/Los_Angeles&mode=WEEK&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=0&height=${height.replace(
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
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <iframe
          src={iframeSrc}
          style={{ width: '100%', border: '0' }}
          frameBorder="0"
          scrolling="yes"
          title="Google Calendar"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default GoogleCalendarComponent;