import { useState, useEffect, useCallback } from 'react';
import { fetchWithToken } from '../context/AuthContext';
import CalendarComponent from '../components/CalendarComponent';

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
  }, []); // Empty dependency array for one-time fetch

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

  const handleEventUpdate = useCallback((updatedEvents) => {
    setEvents(updatedEvents);
    console.log('Events updated in Home:', updatedEvents); // Keep for debugging if needed
  }, []); // Empty dependency array since it only depends on setEvents

  return (
    <div className="min-h-screen pt-24">
      {/* Hero Section */}
      <section className="relative bg-cover bg-center h-96" style={{ backgroundImage: "url('/path-to-farm-image.jpg')" }}>
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative text-center text-white pt-24">
          <h1 className="text-5xl font-bold">Mickelsen Family Farms</h1>
          <p className="mt-4 text-xl">Experience the beauty of rural life with us.</p>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-16 bg-white">
        <h2 className="section-title">About Us</h2>
        <div className="max-w-3xl mx-auto text-center text-gray-700">
          <p>A family-owned farm offering horse boarding, lessons, trail rides, and events. [Add your detailed description here.]</p>
          <img src="/path-to-about-image.jpg" alt="Farm Overview" className="mt-6 rounded-lg" />
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 bg-gray-100">
        <h2 className="section-title">Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Horse Boarding</h3>
            <p>Top-notch boarding with spacious stalls and daily care.</p>
            <button onClick={() => window.location.href = '/horse-boarding'} className="btn-primary mt-4">
              Learn More
            </button>
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Riding Lessons</h3>
            <p>Lessons for all levels with experienced instructors.</p>
            <button onClick={() => window.location.href = '/horse-lessons'} className="btn-primary mt-4">
              Learn More
            </button>
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Trail Rides</h3>
            <p>Guided rides through scenic farm landscapes.</p>
            <button onClick={() => window.location.href = '/trail-rides'} className="btn-primary mt-4">
              Learn More
            </button>
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Events</h3>
            <p>Clinics, open houses, and seasonal celebrations.</p>
            <button onClick={() => window.location.href = '/events'} className="btn-primary mt-4">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Calendar Section */}
      <section id="calendar" className="py-16 bg-white">
        <h2 className="section-title">Calendar</h2>
        <div className="calendar-section">
          <CalendarComponent
            onEventUpdate={handleEventUpdate}
            height="600px"
          />
        </div>
      </section>

      {/* Owners Section */}
      <section id="owners" className="py-16 bg-gray-100">
        <h2 className="section-title">Owners</h2>
        <div className="max-w-md mx-auto text-center">
          <img src="/path-to-owners-image.jpg" alt="Alfred and JoDee Mickelsen" className="rounded-lg mb-4" />
          <p className="text-gray-700">Alfred and JoDee Mickelsen, passionate farm owners.</p>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="py-16 bg-white">
        <h2 className="section-title">Contact Us</h2>
        <div className="max-w-md mx-auto text-center text-gray-700">
          <p>1339 North 500 East, Pleasant Grove, UT 84062</p>
          <p>Email: mickelsenfamilyfarms@gmail.com</p>
          <p>JoDee: +1 801-372-2070 | AL: +1 801-360-6071</p>
        </div>
      </section>

      {/* Request Form */}
      <section className="py-16 bg-gray-100">
        <h3 className="text-2xl font-bold text-center mb-4">Submit a Request</h3>
        <form onSubmit={handleRequestSubmit} className="max-w-md mx-auto">
          <textarea
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="Enter your request"
            className="w-full p-2 mb-4 border rounded"
          />
          <button type="submit" className="btn-primary">
            Submit
          </button>
          {message && <p className="mt-2 text-gray-700">{message}</p>}
        </form>
      </section>
    </div>
  );
}

export default Home;